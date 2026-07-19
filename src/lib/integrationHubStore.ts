import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type IntegrationProvider =
  | 'openai'
  | 'whatsapp'
  | 'meta'
  | 'google'
  | 'wordpress'
  | 'canva'
  | 'n8n'
  | 'make'
  | 'custom'

export type IntegrationStatus = 'disconnected' | 'configured' | 'connected' | 'error'

export interface IntegrationConnection {
  id: string
  provider: IntegrationProvider
  name: string
  endpoint: string
  authType: 'none' | 'bearer' | 'api_key' | 'oauth'
  apiKey: string
  enabled: boolean
  status: IntegrationStatus
  lastTestAt: string
  lastError: string
  timeoutSeconds: number
  createdAt: string
  updatedAt: string
}

export interface SyncJob {
  id: string
  integrationId: string
  action: string
  payload: Record<string, unknown>
  status: 'queued' | 'running' | 'success' | 'failed'
  attempts: number
  lastError: string
  createdAt: string
  updatedAt: string
}

interface IntegrationHubState {
  connections: IntegrationConnection[]
  jobs: SyncJob[]
  addConnection: (data: Omit<IntegrationConnection, 'id' | 'status' | 'lastTestAt' | 'lastError' | 'createdAt' | 'updatedAt'>) => void
  updateConnection: (connection: IntegrationConnection) => void
  removeConnection: (id: string) => void
  toggleConnection: (id: string) => void
  testConnection: (id: string) => Promise<string>
  enqueueJob: (integrationId: string, action: string, payload: Record<string, unknown>) => void
  processJob: (id: string) => Promise<string>
  clearFinishedJobs: () => void
}

const saved = loadLocal<{ connections: IntegrationConnection[]; jobs: SyncJob[] }>('integration_hub', {
  connections: [],
  jobs: []
})

function persist(connections: IntegrationConnection[], jobs: SyncJob[]) {
  saveLocal('integration_hub', { connections, jobs })
}

function requestHeaders(connection: IntegrationConnection): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (connection.authType === 'bearer' && connection.apiKey) {
    headers.Authorization = `Bearer ${connection.apiKey}`
  }

  if (connection.authType === 'api_key' && connection.apiKey) {
    headers['X-API-Key'] = connection.apiKey
  }

  return headers
}

export const useIntegrationHubStore = create<IntegrationHubState>((set, get) => ({
  ...saved,

  addConnection: (data) => set((state) => {
    const now = new Date().toISOString()
    const connection: IntegrationConnection = {
      ...data,
      id: crypto.randomUUID(),
      status: data.endpoint ? 'configured' : 'disconnected',
      lastTestAt: '',
      lastError: '',
      createdAt: now,
      updatedAt: now
    }
    const connections = [connection, ...state.connections]
    persist(connections, state.jobs)
    return { connections }
  }),

  updateConnection: (connection) => set((state) => {
    const connections = state.connections.map((item) =>
      item.id === connection.id
        ? { ...connection, updatedAt: new Date().toISOString() }
        : item
    )
    persist(connections, state.jobs)
    return { connections }
  }),

  removeConnection: (id) => set((state) => {
    const connections = state.connections.filter((item) => item.id !== id)
    const jobs = state.jobs.filter((item) => item.integrationId !== id)
    persist(connections, jobs)
    return { connections, jobs }
  }),

  toggleConnection: (id) => set((state) => {
    const connections = state.connections.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() } : item
    )
    persist(connections, state.jobs)
    return { connections }
  }),

  testConnection: async (id) => {
    const connection = get().connections.find((item) => item.id === id)
    if (!connection) return 'Integração não encontrada.'
    if (!connection.endpoint) return 'Informe um endpoint válido.'

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), Math.max(3, connection.timeoutSeconds) * 1000)

    try {
      const response = await fetch(connection.endpoint, {
        method: 'POST',
        headers: requestHeaders(connection),
        body: JSON.stringify({
          source: 'AgendaMarketingV',
          event: 'connection.test',
          provider: connection.provider,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const now = new Date().toISOString()
      const connections = get().connections.map((item) =>
        item.id === id
          ? { ...item, status: 'connected' as const, lastTestAt: now, lastError: '', updatedAt: now }
          : item
      )
      persist(connections, get().jobs)
      set({ connections })

      logSystem('info', 'Integrações', `Conexão ${connection.name} validada`, connection.endpoint)
      return 'Conexão validada com sucesso.'
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const now = new Date().toISOString()
      const connections = get().connections.map((item) =>
        item.id === id
          ? { ...item, status: 'error' as const, lastTestAt: now, lastError: message, updatedAt: now }
          : item
      )
      persist(connections, get().jobs)
      set({ connections })

      logSystem('error', 'Integrações', `Falha em ${connection.name}`, message)
      return `Falha na conexão: ${message}`
    } finally {
      window.clearTimeout(timer)
    }
  },

  enqueueJob: (integrationId, action, payload) => set((state) => {
    const now = new Date().toISOString()
    const job: SyncJob = {
      id: crypto.randomUUID(),
      integrationId,
      action,
      payload,
      status: 'queued',
      attempts: 0,
      lastError: '',
      createdAt: now,
      updatedAt: now
    }
    const jobs = [job, ...state.jobs].slice(0, 500)
    persist(state.connections, jobs)
    return { jobs }
  }),

  processJob: async (id) => {
    const job = get().jobs.find((item) => item.id === id)
    if (!job) return 'Job não encontrado.'

    const connection = get().connections.find((item) => item.id === job.integrationId)
    if (!connection) return 'Integração do job não encontrada.'
    if (!connection.enabled) return 'Integração desativada.'
    if (!connection.endpoint) return 'Endpoint não configurado.'

    const running = get().jobs.map((item) =>
      item.id === id
        ? { ...item, status: 'running' as const, attempts: item.attempts + 1, updatedAt: new Date().toISOString() }
        : item
    )
    persist(get().connections, running)
    set({ jobs: running })

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), Math.max(3, connection.timeoutSeconds) * 1000)

    try {
      const response = await fetch(connection.endpoint, {
        method: 'POST',
        headers: requestHeaders(connection),
        body: JSON.stringify({
          source: 'AgendaMarketingV',
          action: job.action,
          payload: job.payload,
          jobId: job.id,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const jobs = get().jobs.map((item) =>
        item.id === id
          ? { ...item, status: 'success' as const, lastError: '', updatedAt: new Date().toISOString() }
          : item
      )
      persist(get().connections, jobs)
      set({ jobs })

      logSystem('info', 'Sincronização', `Job ${job.action} concluído`, connection.name)
      return 'Sincronização concluída.'
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const jobs = get().jobs.map((item) =>
        item.id === id
          ? { ...item, status: 'failed' as const, lastError: message, updatedAt: new Date().toISOString() }
          : item
      )
      persist(get().connections, jobs)
      set({ jobs })

      logSystem('error', 'Sincronização', `Job ${job.action} falhou`, message)
      return `Falha na sincronização: ${message}`
    } finally {
      window.clearTimeout(timer)
    }
  },

  clearFinishedJobs: () => set((state) => {
    const jobs = state.jobs.filter((item) => !['success', 'failed'].includes(item.status))
    persist(state.connections, jobs)
    return { jobs }
  })
}))
