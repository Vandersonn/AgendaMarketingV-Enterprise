const http = require('http')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const PORT = Number(process.env.PORT || 8787)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 32 || ADMIN_TOKEN === 'change-me-now') {
  throw new Error('ADMIN_TOKEN é obrigatório e deve ter pelo menos 32 caracteres.')
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.')
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const rateLimits = new Map()

function rateLimited(request, limit = 60, windowMs = 60_000) {
  const ip = request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || entry.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > limit
}

function json(response, status, payload, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Vary': 'Origin'
  }
  if (origin === ALLOWED_ORIGIN) headers['Access-Control-Allow-Origin'] = origin
  response.writeHead(status, headers)
  response.end(JSON.stringify(payload))
}

function body(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > 64 * 1024) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}) }
      catch { reject(new Error('INVALID_JSON')) }
    })
    request.on('error', reject)
  })
}

function isAdmin(request) {
  const supplied = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const expected = Buffer.from(ADMIN_TOKEN)
  const candidate = Buffer.from(supplied)
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

function mapLicense(row) {
  if (!row) return null
  return {
    id: row.id, key: row.key, plan: row.plan, status: row.status,
    customerName: row.customer_name, customerEmail: row.customer_email,
    companyName: row.company_name, cnpj: row.cnpj, maxDevices: row.max_devices,
    issuedAt: row.issued_at, expiresAt: row.expires_at, notes: row.notes
  }
}

function mapActivation(row) {
  if (!row) return null
  return {
    id: row.id, licenseKey: row.license_key || row.license?.key,
    deviceId: row.device_id, deviceName: row.device_name,
    organizationId: row.organization_id, status: row.status,
    activatedAt: row.activated_at, lastSeenAt: row.last_seen_at,
    releasedAt: row.released_at || ''
  }
}

function rpcError(response, error, origin) {
  const message = String(error?.message || '')
  if (message.includes('LICENSE_NOT_FOUND') || message.includes('DEVICE_NOT_FOUND')) return json(response, 404, { ok: false, message: 'Licença ou dispositivo não encontrado.' }, origin)
  if (message.includes('LICENSE_BLOCKED') || message.includes('LICENSE_EXPIRED')) return json(response, 403, { ok: false, message: 'Licença bloqueada ou expirada.' }, origin)
  if (message.includes('DEVICE_LIMIT')) return json(response, 409, { ok: false, message: 'Limite de dispositivos atingido.' }, origin)
  if (message.includes('DEVICE_INVALID')) return json(response, 400, { ok: false, message: 'Dispositivo inválido.' }, origin)
  console.error('license database error', message)
  return json(response, 503, { ok: false, message: 'Serviço de licenças temporariamente indisponível.' }, origin)
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || ''
  if (request.method === 'OPTIONS') {
    if (origin !== ALLOWED_ORIGIN) return json(response, 403, { ok: false }, origin)
    return json(response, 204, {}, origin)
  }
  if (rateLimited(request)) return json(response, 429, { ok: false, message: 'Muitas requisições.' }, origin)

  let url
  try { url = new URL(request.url, 'http://localhost') }
  catch { return json(response, 400, { ok: false, message: 'URL inválida.' }, origin) }

  try {
    if (url.pathname === '/health' && request.method === 'GET') {
      return json(response, 200, { ok: true, service: 'DEVVANDERSON License Server', storage: 'postgresql' }, origin)
    }

    if (url.pathname === '/api/licenses/activate' && request.method === 'POST') {
      const payload = await body(request)
      const { data, error } = await db.rpc('activate_license', {
        p_key: String(payload.key || '').toUpperCase(),
        p_device_id: String(payload.deviceId || ''),
        p_device_name: String(payload.deviceName || 'Dispositivo').slice(0, 200),
        p_organization_id: String(payload.organizationId || '').slice(0, 200)
      })
      if (error) return rpcError(response, error, origin)
      return json(response, 200, { ok: true, license: mapLicense(data.license), activation: mapActivation(data.activation) }, origin)
    }

    if (url.pathname === '/api/licenses/validate' && request.method === 'POST') {
      const payload = await body(request)
      const { data, error } = await db.rpc('validate_license', {
        p_key: String(payload.key || '').toUpperCase(),
        p_device_id: String(payload.deviceId || '')
      })
      if (error) return rpcError(response, error, origin)
      return json(response, 200, { ok: true, license: mapLicense(data.license), activation: mapActivation(data.activation) }, origin)
    }

    if (!url.pathname.startsWith('/api/admin/')) return json(response, 404, { ok: false, message: 'Rota não encontrada.' }, origin)
    if (!isAdmin(request)) return json(response, 401, { ok: false, message: 'Não autorizado.' }, origin)

    if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
      const [licensesResult, activationsResult, eventsResult] = await Promise.all([
        db.from('license_server_licenses').select('*').order('created_at', { ascending: false }),
        db.from('license_server_activations').select('*, license:license_server_licenses(key)').order('activated_at', { ascending: false }),
        db.from('license_server_events').select('*').order('created_at', { ascending: false }).limit(5000)
      ])
      const error = licensesResult.error || activationsResult.error || eventsResult.error
      if (error) return rpcError(response, error, origin)
      const licenses = licensesResult.data.map(mapLicense)
      const activations = activationsResult.data.map(mapActivation)
      return json(response, 200, {
        ok: true,
        summary: {
          licenses: licenses.length,
          activeLicenses: licenses.filter((item) => ['active', 'available'].includes(item.status)).length,
          revokedLicenses: licenses.filter((item) => item.status === 'revoked').length,
          activeDevices: activations.filter((item) => item.status === 'active').length
        },
        licenses,
        activations,
        events: eventsResult.data
      }, origin)
    }

    if (url.pathname === '/api/admin/licenses' && request.method === 'POST') {
      const payload = await body(request)
      const key = String(payload.key || '').trim().toUpperCase()
      if (!key || !payload.expiresAt) return json(response, 400, { ok: false, message: 'Chave e validade são obrigatórias.' }, origin)
      const { data, error } = await db.from('license_server_licenses').insert({
        key, plan: payload.plan || 'pro', status: payload.status || 'available',
        customer_name: payload.customerName || '', customer_email: payload.customerEmail || '',
        company_name: payload.companyName || '', cnpj: payload.cnpj || '',
        max_devices: Number(payload.maxDevices || 1), issued_at: payload.issuedAt || new Date().toISOString(),
        expires_at: payload.expiresAt, notes: payload.notes || ''
      }).select().single()
      if (error) return rpcError(response, error, origin)
      return json(response, 201, { ok: true, license: mapLicense(data) }, origin)
    }

    const licenseMatch = url.pathname.match(/^\/api\/admin\/licenses\/([0-9a-f-]{36})$/i)
    if (licenseMatch && request.method === 'PATCH') {
      const payload = await body(request)
      const patch = {}
      const fields = {
        plan: 'plan', status: 'status', customerName: 'customer_name', customerEmail: 'customer_email',
        companyName: 'company_name', cnpj: 'cnpj', maxDevices: 'max_devices',
        issuedAt: 'issued_at', expiresAt: 'expires_at', notes: 'notes'
      }
      for (const [source, target] of Object.entries(fields)) if (payload[source] !== undefined) patch[target] = payload[source]
      patch.updated_at = new Date().toISOString()
      const { data, error } = await db.from('license_server_licenses').update(patch).eq('id', licenseMatch[1]).select().single()
      if (error) return rpcError(response, error, origin)
      return json(response, 200, { ok: true, license: mapLicense(data) }, origin)
    }

    const activationMatch = url.pathname.match(/^\/api\/admin\/activations\/([0-9a-f-]{36})$/i)
    if (activationMatch && request.method === 'PATCH') {
      const payload = await body(request)
      const allowed = ['active', 'blocked', 'released']
      if (!allowed.includes(payload.status)) return json(response, 400, { ok: false, message: 'Status inválido.' }, origin)
      const patch = { status: payload.status, released_at: payload.status === 'released' ? new Date().toISOString() : null }
      const { data, error } = await db.from('license_server_activations').update(patch).eq('id', activationMatch[1]).select('*, license:license_server_licenses(key)').single()
      if (error) return rpcError(response, error, origin)
      return json(response, 200, { ok: true, activation: mapActivation(data) }, origin)
    }

    return json(response, 404, { ok: false, message: 'Rota não encontrada.' }, origin)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') return json(response, 413, { ok: false, message: 'Corpo muito grande.' }, origin)
    if (error.message === 'INVALID_JSON') return json(response, 400, { ok: false, message: 'JSON inválido.' }, origin)
    console.error('license server error', error instanceof Error ? error.message : String(error))
    return json(response, 500, { ok: false, message: 'Erro interno.' }, origin)
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DEVVANDERSON License Server ativo na porta ${PORT} com PostgreSQL.`)
})
