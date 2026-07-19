import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type ActivationStatus = 'active' | 'blocked' | 'released'

export interface LicenseActivation {
  id: string
  licenseKey: string
  deviceId: string
  deviceName: string
  platform: string
  organizationId: string
  status: ActivationStatus
  activatedAt: string
  lastSeenAt: string
  releasedAt: string
  notes: string
}

export interface LicenseHistoryEvent {
  id: string
  licenseKey: string
  type: 'generated' | 'activated' | 'renewed' | 'revoked' | 'restored' | 'device_released' | 'blocked'
  description: string
  createdAt: string
}

interface ActivationState {
  activations: LicenseActivation[]
  history: LicenseHistoryEvent[]
  registerActivation: (input: {
    licenseKey: string
    deviceId: string
    organizationId: string
    maxDevices: number
  }) => { ok: boolean; message: string; activation?: LicenseActivation }
  touchActivation: (licenseKey: string, deviceId: string) => void
  releaseDevice: (id: string) => void
  blockDevice: (id: string) => void
  restoreDevice: (id: string) => void
  addHistory: (licenseKey: string, type: LicenseHistoryEvent['type'], description: string) => void
  removeHistory: (id: string) => void
  importData: (data: { activations?: LicenseActivation[]; history?: LicenseHistoryEvent[] }) => void
}

const stored = loadLocal<{
  activations?: LicenseActivation[]
  history?: LicenseHistoryEvent[]
}>('license_activations', {})

function persist(activations: LicenseActivation[], history: LicenseHistoryEvent[]) {
  saveLocal('license_activations', { activations, history })
}

function deviceName(): string {
  const platform = navigator.platform || 'Desktop'
  const userAgent = navigator.userAgent
  if (/windows/i.test(userAgent)) return `Windows • ${platform}`
  if (/mac/i.test(userAgent)) return `macOS • ${platform}`
  if (/linux/i.test(userAgent)) return `Linux • ${platform}`
  return platform
}

export const useLicenseActivationStore = create<ActivationState>((set, get) => ({
  activations: Array.isArray(stored.activations) ? stored.activations : [],
  history: Array.isArray(stored.history) ? stored.history : [],

  registerActivation: (input) => {
    const state = get()
    const existing = state.activations.find((item) =>
      item.licenseKey === input.licenseKey &&
      item.deviceId === input.deviceId &&
      item.status !== 'released'
    )

    if (existing) {
      const activations = state.activations.map((item) =>
        item.id === existing.id
          ? { ...item, status: 'active' as const, lastSeenAt: new Date().toISOString(), organizationId: input.organizationId }
          : item
      )
      persist(activations, state.history)
      set({ activations })
      return { ok: true, message: 'Dispositivo já autorizado.', activation: existing }
    }

    const activeDevices = state.activations.filter((item) =>
      item.licenseKey === input.licenseKey && item.status === 'active'
    )

    if (activeDevices.length >= input.maxDevices) {
      const historyEvent: LicenseHistoryEvent = {
        id: crypto.randomUUID(),
        licenseKey: input.licenseKey,
        type: 'blocked',
        description: `Ativação bloqueada: limite de ${input.maxDevices} dispositivo(s) atingido.`,
        createdAt: new Date().toISOString()
      }
      const history = [historyEvent, ...state.history].slice(0, 1000)
      persist(state.activations, history)
      set({ history })
      logSystem('warning', 'Licenciamento', 'Limite de dispositivos atingido', input.licenseKey)
      return { ok: false, message: `Limite de ${input.maxDevices} dispositivo(s) atingido.` }
    }

    const now = new Date().toISOString()
    const activation: LicenseActivation = {
      id: crypto.randomUUID(),
      licenseKey: input.licenseKey,
      deviceId: input.deviceId,
      deviceName: deviceName(),
      platform: navigator.platform || 'Desktop',
      organizationId: input.organizationId,
      status: 'active',
      activatedAt: now,
      lastSeenAt: now,
      releasedAt: '',
      notes: ''
    }
    const historyEvent: LicenseHistoryEvent = {
      id: crypto.randomUUID(),
      licenseKey: input.licenseKey,
      type: 'activated',
      description: `Dispositivo ${activation.deviceName} ativado.`,
      createdAt: now
    }
    const activations = [activation, ...state.activations]
    const history = [historyEvent, ...state.history].slice(0, 1000)
    persist(activations, history)
    set({ activations, history })
    return { ok: true, message: 'Dispositivo autorizado.', activation }
  },

  touchActivation: (licenseKey, deviceId) => set((state) => {
    const activations = state.activations.map((item) =>
      item.licenseKey === licenseKey && item.deviceId === deviceId && item.status === 'active'
        ? { ...item, lastSeenAt: new Date().toISOString() }
        : item
    )
    persist(activations, state.history)
    return { activations }
  }),

  releaseDevice: (id) => set((state) => {
    const target = state.activations.find((item) => item.id === id)
    if (!target) return state
    const now = new Date().toISOString()
    const activations = state.activations.map((item) =>
      item.id === id ? { ...item, status: 'released' as const, releasedAt: now } : item
    )
    const event: LicenseHistoryEvent = {
      id: crypto.randomUUID(),
      licenseKey: target.licenseKey,
      type: 'device_released',
      description: `Dispositivo ${target.deviceName} liberado.`,
      createdAt: now
    }
    const history = [event, ...state.history].slice(0, 1000)
    persist(activations, history)
    return { activations, history }
  }),

  blockDevice: (id) => set((state) => {
    const activations = state.activations.map((item) =>
      item.id === id ? { ...item, status: 'blocked' as const } : item
    )
    persist(activations, state.history)
    return { activations }
  }),

  restoreDevice: (id) => set((state) => {
    const activations = state.activations.map((item) =>
      item.id === id ? { ...item, status: 'active' as const, releasedAt: '' } : item
    )
    persist(activations, state.history)
    return { activations }
  }),

  addHistory: (licenseKey, type, description) => set((state) => {
    const event: LicenseHistoryEvent = {
      id: crypto.randomUUID(),
      licenseKey,
      type,
      description,
      createdAt: new Date().toISOString()
    }
    const history = [event, ...state.history].slice(0, 1000)
    persist(state.activations, history)
    return { history }
  }),

  removeHistory: (id) => set((state) => {
    const history = state.history.filter((item) => item.id !== id)
    persist(state.activations, history)
    return { history }
  }),

  importData: (data) => set((state) => {
    const activationMap = new Map(state.activations.map((item) => [item.id, item]))
    ;(data.activations ?? []).forEach((item) => activationMap.set(item.id, item))
    const historyMap = new Map(state.history.map((item) => [item.id, item]))
    ;(data.history ?? []).forEach((item) => historyMap.set(item.id, item))
    const activations = [...activationMap.values()]
    const history = [...historyMap.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    persist(activations, history)
    return { activations, history }
  })
}))
