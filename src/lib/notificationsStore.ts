import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface AppNotification {
  id: string
  title: string
  description: string
  type: 'crm' | 'marketing' | 'calendar' | 'finance' | 'tasks' | 'system'
  path: string
  read: boolean
  createdAt: string
}

interface NotificationsState {
  manual: AppNotification[]
  readIds: string[]
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  clearManual: () => void
}

const saved = loadLocal<{ manual: AppNotification[]; readIds: string[] }>('notification_center', {
  manual: [],
  readIds: []
})

function persist(manual: AppNotification[], readIds: string[]) {
  saveLocal('notification_center', { manual, readIds })
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  ...saved,

  addNotification: (data) => set((state) => {
    const manual = [{
      ...data,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString()
    }, ...state.manual]
    persist(manual, state.readIds)
    return { manual }
  }),

  markRead: (id) => set((state) => {
    const readIds = state.readIds.includes(id) ? state.readIds : [...state.readIds, id]
    const manual = state.manual.map((item) => item.id === id ? { ...item, read: true } : item)
    persist(manual, readIds)
    return { readIds, manual }
  }),

  markAllRead: (ids) => set((state) => {
    const readIds = Array.from(new Set([...state.readIds, ...ids]))
    const manual = state.manual.map((item) => ({ ...item, read: true }))
    persist(manual, readIds)
    return { readIds, manual }
  }),

  clearManual: () => set((state) => {
    persist([], state.readIds)
    return { manual: [] }
  })
}))
