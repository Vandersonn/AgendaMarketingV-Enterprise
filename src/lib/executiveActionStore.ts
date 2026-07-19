import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface ExecutiveAction {
  id: string
  title: string
  source: string
  status: 'planned' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdAt: string
}

interface ExecutiveActionState {
  actions: ExecutiveAction[]
  addActions: (titles: string[], source: string) => void
  updateStatus: (id: string, status: ExecutiveAction['status']) => void
  remove: (id: string) => void
}

const initial = loadLocal<ExecutiveAction[]>('executive_actions', [])

export const useExecutiveActionStore = create<ExecutiveActionState>((set) => ({
  actions: Array.isArray(initial) ? initial : [],

  addActions: (titles, source) => set((state) => {
    const existing = new Set(state.actions.filter((item) => item.status !== 'done').map((item) => item.title))
    const due = new Date()
    due.setDate(due.getDate() + 7)

    const created = titles
      .filter((title) => !existing.has(title))
      .map((title) => ({
        id: crypto.randomUUID(),
        title,
        source,
        status: 'planned' as const,
        priority: 'high' as const,
        dueDate: due.toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      }))

    const actions = [...created, ...state.actions].slice(0, 200)
    saveLocal('executive_actions', actions)
    return { actions }
  }),

  updateStatus: (id, status) => set((state) => {
    const actions = state.actions.map((item) => item.id === id ? { ...item, status } : item)
    saveLocal('executive_actions', actions)
    return { actions }
  }),

  remove: (id) => set((state) => {
    const actions = state.actions.filter((item) => item.id !== id)
    saveLocal('executive_actions', actions)
    return { actions }
  })
}))
