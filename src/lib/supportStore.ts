import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed'

export interface TicketMessage {
  id: string
  author: string
  message: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  code: string
  clientId?: string
  subject: string
  description: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  assigneeEmail: string
  slaHours: number
  dueAt: string
  messages: TicketMessage[]
  rating?: number
  createdAt: string
  updatedAt: string
}

interface SupportState {
  tickets: SupportTicket[]
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'code' | 'messages' | 'createdAt' | 'updatedAt' | 'dueAt'>) => void
  setStatus: (id: string, status: TicketStatus) => void
  assign: (id: string, email: string) => void
  addMessage: (id: string, author: string, message: string) => void
  rate: (id: string, rating: number) => void
  removeTicket: (id: string) => void
}

const initial = loadLocal<SupportTicket[]>('support_tickets', [])

function persist(tickets: SupportTicket[]) {
  saveLocal('support_tickets', tickets)
}

function codeFor(index: number) {
  return `SUP-${String(index + 1).padStart(5, '0')}`
}

export const useSupportStore = create<SupportState>((set) => ({
  tickets: initial,

  addTicket: (data) => set((state) => {
    const now = new Date()
    const due = new Date(now.getTime() + data.slaHours * 3600000)
    const ticket: SupportTicket = {
      ...data,
      id: crypto.randomUUID(),
      code: codeFor(state.tickets.length),
      dueAt: due.toISOString(),
      messages: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    const tickets = [ticket, ...state.tickets]
    persist(tickets)
    useAuditStore.getState().log({
      action: 'create',
      module: 'Suporte',
      description: `Chamado ${ticket.code} criado: ${ticket.subject}.`,
      user: 'Vanderson de Castro'
    })
    return { tickets }
  }),

  setStatus: (id, status) => set((state) => {
    const tickets = state.tickets.map((item) => item.id === id ? {
      ...item,
      status,
      updatedAt: new Date().toISOString()
    } : item)
    persist(tickets)
    return { tickets }
  }),

  assign: (id, assigneeEmail) => set((state) => {
    const tickets = state.tickets.map((item) => item.id === id ? {
      ...item,
      assigneeEmail,
      updatedAt: new Date().toISOString()
    } : item)
    persist(tickets)
    return { tickets }
  }),

  addMessage: (id, author, message) => set((state) => {
    const tickets = state.tickets.map((item) => item.id === id ? {
      ...item,
      messages: [...item.messages, {
        id: crypto.randomUUID(),
        author,
        message,
        createdAt: new Date().toISOString()
      }],
      updatedAt: new Date().toISOString()
    } : item)
    persist(tickets)
    return { tickets }
  }),

  rate: (id, rating) => set((state) => {
    const tickets = state.tickets.map((item) => item.id === id ? { ...item, rating } : item)
    persist(tickets)
    return { tickets }
  }),

  removeTicket: (id) => set((state) => {
    const tickets = state.tickets.filter((item) => item.id !== id)
    persist(tickets)
    return { tickets }
  })
}))
