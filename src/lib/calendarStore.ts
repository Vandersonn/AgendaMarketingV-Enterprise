import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface CalendarEvent {
  id: string
  title: string
  clientId?: string
  start: string
  end: string
  type: 'meeting' | 'delivery' | 'content' | 'task' | 'call' | 'visit'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes: string
  location?: string
  reminderMinutes?: number
  allDay?: boolean
}

interface CalendarState {
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void
}

const saved = loadLocal<CalendarEvent[]>('calendar_events', [])

export const useCalendarStore = create<CalendarState>((set) => ({
  events: saved,
  addEvent: (event) => set((state) => {
    const events = [...state.events, { ...event, id: crypto.randomUUID() }]
    saveLocal('calendar_events', events)
    return { events }
  }),
  updateEvent: (event) => set((state) => {
    const events = state.events.map((item) => item.id === event.id ? event : item)
    saveLocal('calendar_events', events)
    return { events }
  }),
  removeEvent: (id) => set((state) => {
    const events = state.events.filter((item) => item.id !== id)
    saveLocal('calendar_events', events)
    return { events }
  })
}))
