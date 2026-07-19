import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type TrashEntityType = 'client' | 'lead' | 'opportunity' | 'sales_task' | 'content' | 'ai_asset' | 'metric'

export interface TrashItem {
  id: string
  entityType: TrashEntityType
  entityId: string
  title: string
  storageKey: string
  collection: string
  payload: unknown
  related?: Array<{ collection: string; payload: unknown[] }>
  deletedAt: string
  deletedBy: string
  reason: string
  expiresAt: string
}

interface TrashState {
  items: TrashItem[]
  moveToTrash: (item: Omit<TrashItem, 'id' | 'deletedAt' | 'expiresAt'>) => void
  restore: (id: string) => boolean
  removeForever: (id: string) => void
  emptyTrash: () => void
  cleanupExpired: () => number
}

const STORAGE_KEY = 'smart_trash'
const PREFIX = 'amv_professional_'
const saved = loadLocal<TrashItem[]>(STORAGE_KEY, [])

function persist(items: TrashItem[]) {
  saveLocal(STORAGE_KEY, items)
}

function readStorage(key: string): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key) || '{}') as Record<string, unknown>
  } catch {
    return {}
  }
}

function appendToCollection(data: Record<string, unknown>, collection: string, payload: unknown | unknown[]) {
  const current = Array.isArray(data[collection]) ? data[collection] as unknown[] : []
  const values = Array.isArray(payload) ? payload : [payload]
  const existingIds = new Set(current.map((item) => (item as { id?: string })?.id).filter(Boolean))
  data[collection] = [...values.filter((item) => !existingIds.has((item as { id?: string })?.id)), ...current]
}

export const useTrashStore = create<TrashState>((set, get) => ({
  items: saved,
  moveToTrash: (data) => set((state) => {
    const deletedAt = new Date()
    const expiresAt = new Date(deletedAt)
    expiresAt.setDate(expiresAt.getDate() + 30)
    const items = [{ ...data, id: crypto.randomUUID(), deletedAt: deletedAt.toISOString(), expiresAt: expiresAt.toISOString() }, ...state.items]
    persist(items)
    return { items }
  }),
  restore: (id) => {
    const item = get().items.find((entry) => entry.id === id)
    if (!item) return false
    const data = readStorage(item.storageKey)
    appendToCollection(data, item.collection, item.payload)
    item.related?.forEach((related) => appendToCollection(data, related.collection, related.payload))
    localStorage.setItem(PREFIX + item.storageKey, JSON.stringify(data))
    const items = get().items.filter((entry) => entry.id !== id)
    persist(items)
    set({ items })
    return true
  },
  removeForever: (id) => set((state) => {
    const items = state.items.filter((entry) => entry.id !== id)
    persist(items)
    return { items }
  }),
  emptyTrash: () => {
    persist([])
    set({ items: [] })
  },
  cleanupExpired: () => {
    const now = Date.now()
    const current = get().items
    const items = current.filter((entry) => new Date(entry.expiresAt).getTime() > now)
    const removed = current.length - items.length
    if (removed > 0) {
      persist(items)
      set({ items })
    }
    return removed
  }
}))

export function trashRecord(data: Omit<TrashItem, 'id' | 'deletedAt' | 'expiresAt'>) {
  useTrashStore.getState().moveToTrash(data)
}
