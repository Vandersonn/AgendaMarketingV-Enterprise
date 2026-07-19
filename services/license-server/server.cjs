const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = Number(process.env.PORT || 8787)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN
if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 32 || ADMIN_TOKEN === 'change-me-now') {
  throw new Error('ADMIN_TOKEN é obrigatório e deve ter pelo menos 32 caracteres.')
}
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'license-server.json')

fs.mkdirSync(DATA_DIR, { recursive: true })

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } catch {
    return { licenses: [], activations: [], events: [] }
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8')
}

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
  })
  response.end(JSON.stringify(payload))
}

function body(request) {
  return new Promise((resolve, reject) => {
    let data = ''
    request.on('data', chunk => {
      data += chunk
      if (data.length > 1024 * 1024) request.destroy()
    })
    request.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch (error) { reject(error) }
    })
    request.on('error', reject)
  })
}

function isAdmin(request) {
  return request.headers.authorization === `Bearer ${ADMIN_TOKEN}`
}

function event(db, licenseKey, type, description) {
  db.events.unshift({
    id: crypto.randomUUID(),
    licenseKey,
    type,
    description,
    createdAt: new Date().toISOString()
  })
  db.events = db.events.slice(0, 5000)
}

function activeCount(db, key) {
  return db.activations.filter(item => item.licenseKey === key && item.status === 'active').length
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {})
  const url = new URL(request.url, `http://${request.headers.host}`)

  try {
    if (url.pathname === '/health' && request.method === 'GET') {
      return json(response, 200, { ok: true, service: 'DEVVANDERSON License Server', version: '1.0.0' })
    }

    if (url.pathname === '/api/licenses/activate' && request.method === 'POST') {
      const payload = await body(request)
      const db = readDb()
      const license = db.licenses.find(item => item.key === String(payload.key || '').toUpperCase())
      if (!license) return json(response, 404, { ok: false, message: 'Licença não encontrada.' })
      if (license.status === 'revoked') return json(response, 403, { ok: false, message: 'Licença revogada.' })
      if (new Date(license.expiresAt).getTime() < Date.now()) return json(response, 403, { ok: false, message: 'Licença expirada.' })

      const existing = db.activations.find(item => item.licenseKey === license.key && item.deviceId === payload.deviceId && item.status !== 'released')
      if (existing) {
        existing.status = 'active'
        existing.lastSeenAt = new Date().toISOString()
        writeDb(db)
        return json(response, 200, { ok: true, license, activation: existing })
      }

      if (activeCount(db, license.key) >= Number(license.maxDevices || 1)) {
        event(db, license.key, 'blocked', 'Ativação bloqueada por limite de dispositivos.')
        writeDb(db)
        return json(response, 409, { ok: false, message: 'Limite de dispositivos atingido.' })
      }

      const activation = {
        id: crypto.randomUUID(),
        licenseKey: license.key,
        deviceId: payload.deviceId,
        deviceName: payload.deviceName || 'Dispositivo',
        organizationId: payload.organizationId || '',
        status: 'active',
        activatedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        releasedAt: ''
      }
      db.activations.unshift(activation)
      event(db, license.key, 'activated', `Dispositivo ${activation.deviceName} ativado.`)
      writeDb(db)
      return json(response, 200, { ok: true, license, activation })
    }

    if (url.pathname === '/api/licenses/validate' && request.method === 'POST') {
      const payload = await body(request)
      const db = readDb()
      const license = db.licenses.find(item => item.key === String(payload.key || '').toUpperCase())
      const activation = db.activations.find(item => item.licenseKey === license?.key && item.deviceId === payload.deviceId)
      if (!license || !activation) return json(response, 404, { ok: false, message: 'Licença ou dispositivo não encontrado.' })
      if (license.status !== 'active' && license.status !== 'available') return json(response, 403, { ok: false, message: 'Licença bloqueada.' })
      if (activation.status !== 'active') return json(response, 403, { ok: false, message: 'Dispositivo bloqueado.' })
      if (new Date(license.expiresAt).getTime() < Date.now()) return json(response, 403, { ok: false, message: 'Licença expirada.' })
      activation.lastSeenAt = new Date().toISOString()
      writeDb(db)
      return json(response, 200, { ok: true, license, activation })
    }

    if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
      if (!isAdmin(request)) return json(response, 401, { ok: false, message: 'Não autorizado.' })
      const db = readDb()
      return json(response, 200, {
        ok: true,
        summary: {
          licenses: db.licenses.length,
          activeLicenses: db.licenses.filter(item => item.status === 'active' || item.status === 'available').length,
          revokedLicenses: db.licenses.filter(item => item.status === 'revoked').length,
          activeDevices: db.activations.filter(item => item.status === 'active').length
        },
        licenses: db.licenses,
        activations: db.activations,
        events: db.events
      })
    }

    if (url.pathname === '/api/admin/licenses' && request.method === 'POST') {
      if (!isAdmin(request)) return json(response, 401, { ok: false, message: 'Não autorizado.' })
      const payload = await body(request)
      const db = readDb()
      const key = String(payload.key || '').toUpperCase()
      if (!key) return json(response, 400, { ok: false, message: 'Chave obrigatória.' })
      if (db.licenses.some(item => item.key === key)) return json(response, 409, { ok: false, message: 'Chave já cadastrada.' })

      const license = {
        id: crypto.randomUUID(),
        key,
        plan: payload.plan || 'pro',
        status: payload.status || 'available',
        customerName: payload.customerName || '',
        customerEmail: payload.customerEmail || '',
        companyName: payload.companyName || '',
        cnpj: payload.cnpj || '',
        maxDevices: Number(payload.maxDevices || 1),
        issuedAt: payload.issuedAt || new Date().toISOString(),
        expiresAt: payload.expiresAt,
        notes: payload.notes || ''
      }
      db.licenses.unshift(license)
      event(db, key, 'generated', 'Licença cadastrada no servidor.')
      writeDb(db)
      return json(response, 201, { ok: true, license })
    }

    const licenseMatch = url.pathname.match(/^\/api\/admin\/licenses\/([^/]+)$/)
    if (licenseMatch && request.method === 'PATCH') {
      if (!isAdmin(request)) return json(response, 401, { ok: false, message: 'Não autorizado.' })
      const payload = await body(request)
      const db = readDb()
      const license = db.licenses.find(item => item.id === licenseMatch[1])
      if (!license) return json(response, 404, { ok: false, message: 'Licença não encontrada.' })
      Object.assign(license, payload)
      event(db, license.key, payload.status === 'revoked' ? 'revoked' : 'renewed', 'Licença atualizada no servidor.')
      writeDb(db)
      return json(response, 200, { ok: true, license })
    }

    const activationMatch = url.pathname.match(/^\/api\/admin\/activations\/([^/]+)$/)
    if (activationMatch && request.method === 'PATCH') {
      if (!isAdmin(request)) return json(response, 401, { ok: false, message: 'Não autorizado.' })
      const payload = await body(request)
      const db = readDb()
      const activation = db.activations.find(item => item.id === activationMatch[1])
      if (!activation) return json(response, 404, { ok: false, message: 'Ativação não encontrada.' })
      Object.assign(activation, payload)
      if (payload.status === 'released') activation.releasedAt = new Date().toISOString()
      event(db, activation.licenseKey, 'device_updated', `Dispositivo alterado para ${activation.status}.`)
      writeDb(db)
      return json(response, 200, { ok: true, activation })
    }

    return json(response, 404, { ok: false, message: 'Rota não encontrada.' })
  } catch (error) {
    return json(response, 500, { ok: false, message: error.message || String(error) })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DEVVANDERSON License Server ativo em http://localhost:${PORT}`)
  console.log('Defina ADMIN_TOKEN no ambiente antes de usar em produção.')
})
