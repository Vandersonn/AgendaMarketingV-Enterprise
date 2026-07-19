import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type BusinessEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'client.created'
  | 'task.created'
  | 'task.completed'
  | 'project.updated'
  | 'finance.overdue'
  | 'contract.expiring'
  | 'support.sla_breached'
  | 'content.approval_pending'
  | 'mission.created'
  | 'mission.completed'
  | 'system.custom'

export interface BusinessEvent {
  id: string
  type: BusinessEventType
  title: string
  description: string
  source: string
  entityId: string
  payload: Record<string, unknown>
  processed: boolean
  createdAt: string
}

interface EventBusState {
  events: BusinessEvent[]
  publish: (event: Omit<BusinessEvent, 'id' | 'processed' | 'createdAt'>) => string
  markProcessed: (id: string) => void
  clearProcessed: () => void
}

const initial = loadLocal<BusinessEvent[]>('event_bus', [])

function persist(events: BusinessEvent[]) {
  saveLocal('event_bus', events)
}

export const useEventBusStore = create<EventBusState>((set) => ({
  events: Array.isArray(initial) ? initial : [],

  publish: (data) => {
    const event: BusinessEvent = {
      ...data,
      id: crypto.randomUUID(),
      processed: false,
      createdAt: new Date().toISOString()
    }

    set((state) => {
      const events = [event, ...state.events].slice(0, 1000)
      persist(events)
      return { events }
    })

    logSystem('info', 'Barramento de Eventos', data.title, data.type)
    return event.id
  },

  markProcessed: (id) => set((state) => {
    const events = state.events.map((item) => item.id === id ? { ...item, processed: true } : item)
    persist(events)
    return { events }
  }),

  clearProcessed: () => set((state) => {
    const events = state.events.filter((item) => !item.processed)
    persist(events)
    return { events }
  })
}))
