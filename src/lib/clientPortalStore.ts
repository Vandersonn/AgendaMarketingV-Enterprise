import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface PortalAccess {
  id: string
  clientId: string
  accessCode: string
  active: boolean
  createdAt: string
}

export interface ClientRequest {
  id: string
  clientId: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'completed'
  createdAt: string
}

interface PortalState {
  accesses: PortalAccess[]
  requests: ClientRequest[]
  createAccess: (clientId: string) => PortalAccess
  toggleAccess: (id: string) => void
  addRequest: (request: Omit<ClientRequest, 'id' | 'createdAt' | 'status'>) => void
  setRequestStatus: (id: string, status: ClientRequest['status']) => void
}

const saved = loadLocal<{ accesses: PortalAccess[]; requests: ClientRequest[] }>('client_portal', {
  accesses: [],
  requests: []
})

function persist(accesses: PortalAccess[], requests: ClientRequest[]) {
  saveLocal('client_portal', { accesses, requests })
}

export const useClientPortalStore = create<PortalState>((set, get) => ({
  ...saved,

  createAccess: (clientId) => {
    const existing = get().accesses.find((item) => item.clientId === clientId)
    if (existing) return existing

    const access: PortalAccess = {
      id: crypto.randomUUID(),
      clientId,
      accessCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      active: true,
      createdAt: new Date().toISOString()
    }

    const accesses = [access, ...get().accesses]
    persist(accesses, get().requests)
    set({ accesses })
    return access
  },

  toggleAccess: (id) => set((state) => {
    const accesses = state.accesses.map((item) => item.id === id ? { ...item, active: !item.active } : item)
    persist(accesses, state.requests)
    return { accesses }
  }),

  addRequest: (data) => set((state) => {
    const requests = [{
      ...data,
      id: crypto.randomUUID(),
      status: 'open' as const,
      createdAt: new Date().toISOString()
    }, ...state.requests]
    persist(state.accesses, requests)
    return { requests }
  }),

  setRequestStatus: (id, status) => set((state) => {
    const requests = state.requests.map((item) => item.id === id ? { ...item, status } : item)
    persist(state.accesses, requests)
    return { requests }
  })
}))
