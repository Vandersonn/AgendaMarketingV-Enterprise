import assert from 'node:assert/strict'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_TEST_URL
const serviceRole = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
const integration = url && serviceRole ? test : test.skip

integration('ativação concorrente respeita o limite transacional de dispositivos', async () => {
  const client = createClient(url!, serviceRole!, { auth: { persistSession: false } })
  const key = `TEST-${crypto.randomUUID()}`.toUpperCase()
  const { data: license, error: createError } = await client
    .from('license_server_licenses')
    .insert({ key, expires_at: new Date(Date.now() + 86_400_000).toISOString(), max_devices: 1 })
    .select('id')
    .single()
  assert.ifError(createError)

  try {
    const attempts = await Promise.all([
      client.rpc('activate_license', { p_key: key, p_device_id: `device-a-${crypto.randomUUID()}`, p_device_name: 'A', p_organization_id: '' }),
      client.rpc('activate_license', { p_key: key, p_device_id: `device-b-${crypto.randomUUID()}`, p_device_name: 'B', p_organization_id: '' })
    ])
    const diagnostics = attempts.map((result) => result.error
      ? { code: result.error.code, message: result.error.message, details: result.error.details, hint: result.error.hint }
      : { ok: true })
    assert.equal(attempts.filter((result) => !result.error).length, 1, JSON.stringify(diagnostics))
    assert.equal(attempts.filter((result) => result.error?.message.includes('DEVICE_LIMIT')).length, 1, JSON.stringify(diagnostics))

    const { count, error } = await client
      .from('license_server_activations')
      .select('*', { count: 'exact', head: true })
      .eq('license_id', license.id)
      .eq('status', 'active')
    assert.ifError(error)
    assert.equal(count, 1)
  } finally {
    await client.from('license_server_licenses').delete().eq('id', license.id)
  }
})

integration('request_id impede entregas duplicadas do WhatsApp', async () => {
  const client = createClient(url!, serviceRole!, { auth: { persistSession: false } })
  const requestId = crypto.randomUUID()
  const organizationId = process.env.SUPABASE_TEST_ORGANIZATION_ID
  const channelId = process.env.SUPABASE_TEST_WHATSAPP_CHANNEL_ID
  if (!organizationId || !channelId) return

  const delivery = {
    request_id: requestId,
    organization_id: organizationId,
    channel_id: channelId,
    contact_key: 'integration:test',
    recipient: '5511999999999',
    message_preview: 'teste',
    status: 'queued'
  }
  const first = await client.from('whatsapp_message_deliveries').insert(delivery)
  assert.ifError(first.error)
  const duplicate = await client.from('whatsapp_message_deliveries').insert(delivery)
  assert.ok(duplicate.error, 'a segunda inserção deveria violar a chave de idempotência')
  await client.from('whatsapp_message_deliveries').delete().eq('request_id', requestId)
})
