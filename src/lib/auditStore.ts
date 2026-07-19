import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface AuditEntry {
  id: string
  action: string
  module: string
  description: string
  user: string
  createdAt: string
}

interface AuditState {
  entries: AuditEntry[]
  log: (entry: Omit<AuditEntry, 'id' | 'createdAt'>) => void
  clear: () => void
}

const saved = loadLocal<AuditEntry[]>('audit_entries', [])

export const useAuditStore = create<AuditState>((set) => ({
  entries: saved,
  log: (entry) => set((state) => {
    const entries = [{
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }, ...state.entries].slice(0, 500)
    saveLocal('audit_entries', entries)
    return { entries }
  }),
  clear: () => {
    saveLocal('audit_entries', [])
    set({ entries: [] })
  }
}))
