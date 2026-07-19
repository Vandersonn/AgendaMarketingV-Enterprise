import { create } from 'zustand'
import { exportLocalData, loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type CloudProviderId = 'proton-drive' | 'google-drive'

export interface CloudProviderConfig {
  id: CloudProviderId
  enabled: boolean
  connected: boolean
  folderPath: string
  googleClientId: string
  automaticBackup: boolean
  intervalMinutes: number
  lastSyncAt: string
  lastError: string
}

export interface CloudFileRecord {
  id: string
  provider: CloudProviderId
  name: string
  pathOrId: string
  size: number
  modifiedAt: string
}

interface CloudProvidersState {
  providers: Record<CloudProviderId, CloudProviderConfig>
  files: CloudFileRecord[]
  running: boolean
  updateProvider: (id: CloudProviderId, partial: Partial<CloudProviderConfig>) => void
  chooseProtonFolder: () => Promise<void>
  connectGoogle: () => Promise<void>
  disconnectGoogle: () => Promise<void>
  refreshStatus: () => Promise<void>
  syncNow: (id: CloudProviderId) => Promise<void>
  listFiles: (id: CloudProviderId) => Promise<void>
  restoreLocalFile: (path: string) => Promise<{ ok: boolean; records: number }>
}

const defaults: Record<CloudProviderId, CloudProviderConfig> = {
  'proton-drive': {
    id: 'proton-drive',
    enabled: false,
    connected: false,
    folderPath: '',
    googleClientId: '',
    automaticBackup: false,
    intervalMinutes: 60,
    lastSyncAt: '',
    lastError: ''
  },
  'google-drive': {
    id: 'google-drive',
    enabled: false,
    connected: false,
    folderPath: '',
    googleClientId: '',
    automaticBackup: false,
    intervalMinutes: 60,
    lastSyncAt: '',
    lastError: ''
  }
}

const initial = loadLocal<Partial<Record<CloudProviderId, CloudProviderConfig>>>('cloud_providers', {})

function mergedProviders(): Record<CloudProviderId, CloudProviderConfig> {
  return {
    'proton-drive': { ...defaults['proton-drive'], ...(initial['proton-drive'] ?? {}) },
    'google-drive': { ...defaults['google-drive'], ...(initial['google-drive'] ?? {}) }
  }
}

function persist(providers: Record<CloudProviderId, CloudProviderConfig>) {
  saveLocal('cloud_providers', providers)
}

function backupContent() {
  return JSON.stringify({
    app: 'AgendaMarketingV',
    version: '1.0.0-rc.4',
    exportedAt: new Date().toISOString(),
    data: exportLocalData()
  }, null, 2)
}

function backupFilename() {
  return `AgendaMarketingV-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
}

export const useCloudProvidersStore = create<CloudProvidersState>((set, get) => ({
  providers: mergedProviders(),
  files: [],
  running: false,

  updateProvider: (id, partial) => set((state) => {
    const providers = {
      ...state.providers,
      [id]: { ...state.providers[id], ...partial }
    }
    persist(providers)
    return { providers }
  }),

  chooseProtonFolder: async () => {
    if (!window.agendaDesktop) throw new Error('Seleção de pasta disponível somente no aplicativo Windows.')
    const result = await window.agendaDesktop.chooseCloudFolder()
    if (!result.ok || !result.folderPath) return
    get().updateProvider('proton-drive', {
      folderPath: result.folderPath,
      connected: true,
      enabled: true,
      lastError: ''
    })
    logSystem('info', 'Conexões em Nuvem', 'Pasta do Proton Drive configurada', result.folderPath)
  },

  connectGoogle: async () => {
    const provider = get().providers['google-drive']
    if (!window.agendaDesktop) throw new Error('OAuth do Google disponível somente no aplicativo Windows.')
    if (!provider.googleClientId.trim()) throw new Error('Informe o Client ID OAuth do Google.')
    set({ running: true })
    try {
      await window.agendaDesktop.connectGoogleDrive(provider.googleClientId.trim())
      get().updateProvider('google-drive', {
        connected: true,
        enabled: true,
        lastError: ''
      })
      logSystem('info', 'Google Drive', 'Conta conectada', 'OAuth 2.0 concluído.')
    } catch (error) {
      get().updateProvider('google-drive', {
        connected: false,
        lastError: error instanceof Error ? error.message : String(error)
      })
      throw error
    } finally {
      set({ running: false })
    }
  },

  disconnectGoogle: async () => {
    if (window.agendaDesktop) await window.agendaDesktop.disconnectGoogleDrive()
    get().updateProvider('google-drive', {
      connected: false,
      enabled: false,
      lastSyncAt: ''
    })
  },

  refreshStatus: async () => {
    if (!window.agendaDesktop) return
    const status = await window.agendaDesktop.googleDriveStatus()
    get().updateProvider('google-drive', { connected: status.connected })
  },

  syncNow: async (id) => {
    const provider = get().providers[id]
    set({ running: true })
    try {
      const content = backupContent()
      const filename = backupFilename()

      if (id === 'proton-drive') {
        if (!provider.folderPath) throw new Error('Selecione a pasta local sincronizada pelo Proton Drive.')
        if (!window.agendaDesktop) throw new Error('Proton Drive por pasta está disponível no aplicativo Windows.')
        await window.agendaDesktop.writeCloudFile({
          folderPath: provider.folderPath,
          filename,
          content
        })
      } else {
        if (!provider.connected) throw new Error('Conecte o Google Drive.')
        if (!window.agendaDesktop) throw new Error('Google Drive disponível no aplicativo Windows.')
        await window.agendaDesktop.uploadGoogleBackup({
          clientId: provider.googleClientId,
          filename,
          content
        })
      }

      const lastSyncAt = new Date().toISOString()
      get().updateProvider(id, { lastSyncAt, lastError: '' })
      await get().listFiles(id)
      logSystem('info', 'Conexões em Nuvem', `Backup enviado para ${id}`, filename)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      get().updateProvider(id, { lastError: message })
      logSystem('error', 'Conexões em Nuvem', `Falha em ${id}`, message)
      throw error
    } finally {
      set({ running: false })
    }
  },

  listFiles: async (id) => {
    const provider = get().providers[id]
    if (!window.agendaDesktop) return

    if (id === 'proton-drive') {
      if (!provider.folderPath) return
      const response = await window.agendaDesktop.listCloudFiles(provider.folderPath)
      const files: CloudFileRecord[] = response.files.map((file) => ({
        id: file.filePath,
        provider: id,
        name: file.name,
        pathOrId: file.filePath,
        size: file.size,
        modifiedAt: file.modifiedAt
      }))
      set((state) => ({ files: [...files, ...state.files.filter((item) => item.provider !== id)] }))
      return
    }

    if (!provider.connected || !provider.googleClientId) return
    const response = await window.agendaDesktop.listGoogleBackups(provider.googleClientId)
    const files: CloudFileRecord[] = response.files.map((file) => ({
      id: file.id,
      provider: id,
      name: file.name,
      pathOrId: file.id,
      size: Number(file.size || 0),
      modifiedAt: file.modifiedTime || ''
    }))
    set((state) => ({ files: [...files, ...state.files.filter((item) => item.provider !== id)] }))
  },

  restoreLocalFile: async (path) => {
    if (!window.agendaDesktop) throw new Error('Restauração disponível somente no aplicativo Windows.')
    const response = await window.agendaDesktop.readCloudFile(path)
    const payload = JSON.parse(response.content)
    const data = payload?.data
    if (!data || typeof data !== 'object') throw new Error('Backup inválido.')

    let records = 0
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      records += 1
    })
    return { ok: true, records }
  }
}))
