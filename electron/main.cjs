const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const crypto = require('crypto')


function safeFileName(value) {
  return String(value || 'backup').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').slice(0, 120)
}

function tokenFilePath() {
  return path.join(app.getPath('userData'), 'google-drive-token.bin')
}

function saveGoogleToken(token) {
  const value = JSON.stringify(token)
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(tokenFilePath(), safeStorage.encryptString(value))
  } else {
    fs.writeFileSync(tokenFilePath(), Buffer.from(value, 'utf8'))
  }
}

function loadGoogleToken() {
  try {
    const buffer = fs.readFileSync(tokenFilePath())
    const value = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buffer)
      : buffer.toString('utf8')
    return JSON.parse(value)
  } catch {
    return null
  }
}

function deleteGoogleToken() {
  try { fs.unlinkSync(tokenFilePath()) } catch {}
}

async function refreshGoogleToken(token, clientId) {
  if (!token?.refresh_token) throw new Error('Refresh token indisponível.')
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token'
  })
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error_description || data.error || 'Falha ao renovar token.')
  const updated = {
    ...token,
    ...data,
    expires_at: Date.now() + Number(data.expires_in || 3600) * 1000
  }
  saveGoogleToken(updated)
  return updated
}

async function getGoogleAccessToken(clientId) {
  let token = loadGoogleToken()
  if (!token) throw new Error('Google Drive não conectado.')
  if (token.expires_at && token.expires_at <= Date.now() + 60000) {
    token = await refreshGoogleToken(token, clientId)
  }
  return token.access_token
}

async function googleRequest(url, options, clientId) {
  const accessToken = await getGoogleAccessToken(clientId)
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Drive: ${response.status} ${text.slice(0, 300)}`)
  }
  return response
}

async function ensureGoogleFolder(clientId) {
  const query = encodeURIComponent("name='AgendaMarketingV' and mimeType='application/vnd.google-apps.folder' and trashed=false")
  const list = await googleRequest(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
    { method: 'GET' },
    clientId
  )
  const data = await list.json()
  if (data.files?.[0]?.id) return data.files[0].id

  const create = await googleRequest(
    'https://www.googleapis.com/drive/v3/files?fields=id',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AgendaMarketingV',
        mimeType: 'application/vnd.google-apps.folder'
      })
    },
    clientId
  )
  return (await create.json()).id
}

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#f7f8fc',
    title: 'AgendaMarketingV',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'public', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

ipcMain.handle('backup:save', async (_event, content) => {
  const result = await dialog.showSaveDialog({
    title: 'Salvar backup do AgendaMarketingV',
    defaultPath: `AgendaMarketingV-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'Backup JSON', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return { ok: false }
  fs.writeFileSync(result.filePath, content, 'utf8')
  return { ok: true, filePath: result.filePath }
})


ipcMain.handle('cloud:chooseFolder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Selecionar pasta sincronizada',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths[0]) return { ok: false }
  return { ok: true, folderPath: result.filePaths[0] }
})

ipcMain.handle('cloud:writeFile', async (_event, payload) => {
  const folderPath = payload?.folderPath
  if (!folderPath || !fs.existsSync(folderPath)) throw new Error('Pasta de sincronização não encontrada.')
  const targetDir = path.join(folderPath, 'AgendaMarketingV')
  fs.mkdirSync(targetDir, { recursive: true })
  const filename = safeFileName(payload?.filename || `backup-${Date.now()}.json`)
  const filePath = path.join(targetDir, filename)
  fs.writeFileSync(filePath, String(payload?.content || ''), 'utf8')
  return { ok: true, filePath }
})

ipcMain.handle('cloud:listFiles', async (_event, folderPath) => {
  if (!folderPath || !fs.existsSync(folderPath)) return { ok: false, files: [] }
  const targetDir = path.join(folderPath, 'AgendaMarketingV')
  if (!fs.existsSync(targetDir)) return { ok: true, files: [] }
  const files = fs.readdirSync(targetDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const filePath = path.join(targetDir, name)
      const stats = fs.statSync(filePath)
      return { name, filePath, size: stats.size, modifiedAt: stats.mtime.toISOString() }
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  return { ok: true, files }
})

ipcMain.handle('cloud:readFile', async (_event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) throw new Error('Arquivo não encontrado.')
  return { ok: true, content: fs.readFileSync(filePath, 'utf8') }
})

ipcMain.handle('google:connect', async (_event, clientId) => {
  if (!clientId) throw new Error('Informe o Client ID OAuth do Google.')

  const verifier = crypto.randomBytes(48).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  const state = crypto.randomBytes(24).toString('hex')

  return await new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url, 'http://127.0.0.1')
        if (requestUrl.pathname !== '/oauth2callback') return
        if (requestUrl.searchParams.get('state') !== state) throw new Error('Estado OAuth inválido.')
        const code = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')
        if (error) throw new Error(error)
        if (!code) throw new Error('Código OAuth não recebido.')

        const redirectUri = `http://127.0.0.1:${server.address().port}/oauth2callback`
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            code,
            code_verifier: verifier,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        })
        const token = await tokenResponse.json()
        if (!tokenResponse.ok) throw new Error(token.error_description || token.error || 'Falha OAuth.')
        token.expires_at = Date.now() + Number(token.expires_in || 3600) * 1000
        token.client_id = clientId
        saveGoogleToken(token)

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        response.end('<h1>Google Drive conectado</h1><p>Você pode fechar esta janela e voltar ao AgendaMarketingV.</p>')
        server.close()
        resolve({ ok: true })
      } catch (error) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        response.end(error.message)
        server.close()
        reject(error)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      const redirectUri = `http://127.0.0.1:${port}/oauth2callback`
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('code_challenge', challenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('state', state)
      shell.openExternal(authUrl.toString())
    })

    server.on('error', reject)
    setTimeout(() => {
      try { server.close() } catch {}
      reject(new Error('Tempo de conexão com Google Drive esgotado.'))
    }, 180000)
  })
})

ipcMain.handle('google:status', async () => {
  const token = loadGoogleToken()
  return { connected: Boolean(token), expiresAt: token?.expires_at || 0 }
})

ipcMain.handle('google:disconnect', async () => {
  deleteGoogleToken()
  return { ok: true }
})

ipcMain.handle('google:uploadBackup', async (_event, payload) => {
  const clientId = payload?.clientId
  if (!clientId) throw new Error('Client ID do Google não configurado.')
  const folderId = await ensureGoogleFolder(clientId)
  const metadata = {
    name: safeFileName(payload?.filename || `AgendaMarketingV-backup-${Date.now()}.json`),
    parents: [folderId],
    mimeType: 'application/json'
  }
  const boundary = `agenda_${crypto.randomBytes(12).toString('hex')}`
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${String(payload?.content || '')}\r\n`,
    `--${boundary}--`
  ].join('')

  const response = await googleRequest(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size',
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body
    },
    clientId
  )
  return { ok: true, file: await response.json() }
})

ipcMain.handle('google:listBackups', async (_event, clientId) => {
  const folderId = await ensureGoogleFolder(clientId)
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`)
  const response = await googleRequest(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,modifiedTime)&orderBy=modifiedTime desc&pageSize=100`,
    { method: 'GET' },
    clientId
  )
  return { ok: true, files: (await response.json()).files || [] }
})

ipcMain.handle('system:openExternal', (_event, url) => shell.openExternal(url))

app.whenReady().then(createWindow)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
