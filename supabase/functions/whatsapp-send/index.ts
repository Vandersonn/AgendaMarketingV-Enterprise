import { createClient } from 'npm:@supabase/supabase-js@2'

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Configuração ausente: ${name}`)
  return value
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: jsonHeaders })
  if (request.method !== 'POST') return response(405, { error: 'Método não permitido.' })

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return response(401, { error: 'Autenticação obrigatória.' })

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const anonKey = requiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) return response(401, { error: 'Sessão inválida.' })

    const body = await request.json()
    const organizationId = String(body?.organizationId || '')
    const channelId = String(body?.channelId || '')
    const contactKey = String(body?.contactKey || '').trim()
    const recipient = String(body?.to || '').replace(/\D/g, '')
    const text = String(body?.text || '').trim()

    if (!/^[0-9a-f-]{36}$/i.test(organizationId) || !/^[0-9a-f-]{36}$/i.test(channelId)) {
      return response(400, { error: 'Organização ou canal inválido.' })
    }
    if (!contactKey || recipient.length < 8 || recipient.length > 15 || !text || text.length > 4096) {
      return response(400, { error: 'Contato, destinatário ou mensagem inválidos.' })
    }

    const { data: membership } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', authData.user.id)
      .eq('active', true)
      .maybeSingle()
    if (!membership) return response(403, { error: 'Usuário sem acesso à organização.' })

    const { data: consent } = await adminClient
      .from('contact_communication_consents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('contact_key', contactKey)
      .is('revoked_at', null)
      .not('granted_at', 'is', null)
      .maybeSingle()
    if (!consent) return response(409, { error: 'Consentimento ativo não encontrado para este contato.' })

    const { data: channel } = await adminClient
      .from('whatsapp_business_channels')
      .select('id, channel_key, phone_number_id, enabled')
      .eq('id', channelId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (!channel?.enabled || !channel.phone_number_id) {
      return response(409, { error: 'Canal de WhatsApp inativo ou incompleto.' })
    }

    const tokenName = channel.channel_key === 'channel-1'
      ? 'WHATSAPP_ACCESS_TOKEN_CHANNEL_1'
      : channel.channel_key === 'channel-2'
        ? 'WHATSAPP_ACCESS_TOKEN_CHANNEL_2'
        : ''
    if (!tokenName) return response(409, { error: 'Canal não reconhecido.' })

    const graphVersion = requiredEnv('META_GRAPH_API_VERSION')
    if (!/^v\d+\.\d+$/.test(graphVersion)) throw new Error('META_GRAPH_API_VERSION inválida.')
    const accessToken = requiredEnv(tokenName)

    const { data: delivery, error: logError } = await adminClient
      .from('whatsapp_message_deliveries')
      .insert({
        organization_id: organizationId,
        channel_id: channel.id,
        contact_key: contactKey,
        recipient,
        message_preview: text.slice(0, 120),
        status: 'queued',
        created_by: authData.user.id
      })
      .select('id')
      .single()
    if (logError || !delivery) throw new Error('Não foi possível registrar a tentativa de envio.')

    const providerResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${channel.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: { preview_url: false, body: text }
        })
      }
    )
    const providerBody = await providerResponse.json().catch(() => ({}))
    const providerMessageId = providerBody?.messages?.[0]?.id || null

    await adminClient
      .from('whatsapp_message_deliveries')
      .update({
        provider_message_id: providerMessageId,
        status: providerResponse.ok ? 'accepted' : 'failed',
        error_code: providerResponse.ok ? null : String(providerBody?.error?.code || providerResponse.status),
        error_message: providerResponse.ok ? null : String(providerBody?.error?.message || 'Falha no provedor').slice(0, 500),
        updated_at: new Date().toISOString()
      })
      .eq('id', delivery.id)

    if (!providerResponse.ok) return response(502, { error: 'A Meta recusou a mensagem.', deliveryId: delivery.id })
    return response(202, { ok: true, deliveryId: delivery.id, providerMessageId })
  } catch (error) {
    console.error('whatsapp-send failed', error instanceof Error ? error.message : String(error))
    return response(500, { error: 'Não foi possível processar o envio com segurança.' })
  }
})
