import { createClient } from 'npm:@supabase/supabase-js@2'

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Configuração ausente: ${name}`)
  return value
}

function textResponse(status: number, body: string) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

async function hmacHex(secret: string, content: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(content))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

Deno.serve(async (request) => {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && challenge && token === requiredEnv('META_WEBHOOK_VERIFY_TOKEN')) {
      return textResponse(200, challenge)
    }
    return textResponse(403, 'Verificação recusada.')
  }

  if (request.method !== 'POST') return textResponse(405, 'Método não permitido.')

  try {
    const rawBody = await request.text()
    const supplied = request.headers.get('x-hub-signature-256') || ''
    const expected = `sha256=${await hmacHex(requiredEnv('META_APP_SECRET'), rawBody)}`
    if (!constantTimeEqual(supplied, expected)) return textResponse(401, 'Assinatura inválida.')

    const payload = JSON.parse(rawBody)
    if (payload?.object !== 'whatsapp_business_account') return textResponse(200, 'Ignorado.')

    const admin = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false }
    })

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change?.field !== 'messages') continue
        const value = change.value || {}
        const phoneNumberId = String(value.metadata?.phone_number_id || '')
        if (!phoneNumberId) continue

        const { data: channel } = await admin
          .from('whatsapp_business_channels')
          .select('id, organization_id')
          .eq('phone_number_id', phoneNumberId)
          .eq('enabled', true)
          .maybeSingle()
        if (!channel) continue

        for (const status of value.statuses || []) {
          const providerMessageId = String(status?.id || '')
          const nextStatus = String(status?.status || '')
          if (!providerMessageId || !['sent', 'delivered', 'read', 'failed'].includes(nextStatus)) continue
          const error = status?.errors?.[0]
          const { error: statusError } = await admin
            .from('whatsapp_message_deliveries')
            .update({
              status: nextStatus,
              error_code: error?.code ? String(error.code) : null,
              error_message: error?.title ? String(error.title).slice(0, 500) : null,
              updated_at: new Date().toISOString()
            })
            .eq('organization_id', channel.organization_id)
            .eq('channel_id', channel.id)
            .eq('provider_message_id', providerMessageId)
          if (statusError) throw new Error('Falha ao persistir status de entrega.')
        }

        for (const message of value.messages || []) {
          const providerMessageId = String(message?.id || '')
          const sender = String(message?.from || '').replace(/\D/g, '')
          const messageType = String(message?.type || 'unknown')
          if (!providerMessageId || sender.length < 8 || sender.length > 15) continue
          const receivedAt = new Date(Number(message?.timestamp || 0) * 1000)
          const { error: inboundError } = await admin
            .from('whatsapp_inbound_messages')
            .upsert({
              organization_id: channel.organization_id,
              channel_id: channel.id,
              provider_message_id: providerMessageId,
              sender,
              message_type: messageType,
              body: messageType === 'text' ? String(message?.text?.body || '').slice(0, 4096) : null,
              received_at: Number.isNaN(receivedAt.getTime()) ? new Date().toISOString() : receivedAt.toISOString()
            }, { onConflict: 'provider_message_id', ignoreDuplicates: true })
          if (inboundError) throw new Error('Falha ao persistir mensagem recebida.')
        }
      }
    }

    return textResponse(200, 'EVENT_RECEIVED')
  } catch (error) {
    console.error('whatsapp-webhook failed', error instanceof Error ? error.message : String(error))
    return textResponse(500, 'Falha ao processar evento.')
  }
})
