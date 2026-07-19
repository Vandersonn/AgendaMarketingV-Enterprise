import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type FinanceType = 'income' | 'expense'
export type FinanceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface FinanceEntry {
  id: string
  type: FinanceType
  description: string
  category: string
  clientId?: string
  value: number
  dueDate: string
  paidDate: string
  status: FinanceStatus
  paymentMethod: string
  recurring: boolean
  notes: string
  createdAt: string
}

interface FinanceState {
  entries: FinanceEntry[]
  monthlyGoal: number
  addEntry: (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => void
  updateEntry: (entry: FinanceEntry) => void
  removeEntry: (id: string) => void
  markPaid: (id: string) => void
  setMonthlyGoal: (value: number) => void
}

const initial = loadLocal<{ entries: FinanceEntry[]; monthlyGoal: number }>('finance_data', {
  entries: [],
  monthlyGoal: 10000
})

function persist(entries: FinanceEntry[], monthlyGoal: number) {
  saveLocal('finance_data', { entries, monthlyGoal })
}

export const useFinanceStore = create<FinanceState>((set) => ({
  ...initial,

  addEntry: (data) => set((state) => {
    const entries = [{
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }, ...state.entries]
    persist(entries, state.monthlyGoal)
    return { entries }
  }),

  updateEntry: (entry) => set((state) => {
    const entries = state.entries.map((item) => item.id === entry.id ? entry : item)
    persist(entries, state.monthlyGoal)
    return { entries }
  }),

  removeEntry: (id) => set((state) => {
    const entries = state.entries.filter((item) => item.id !== id)
    persist(entries, state.monthlyGoal)
    return { entries }
  }),

  markPaid: (id) => set((state) => {
    const entries = state.entries.map((item) => item.id === id ? {
      ...item,
      status: 'paid' as const,
      paidDate: new Date().toISOString().slice(0, 10)
    } : item)
    persist(entries, state.monthlyGoal)
    return { entries }
  }),

  setMonthlyGoal: (monthlyGoal) => set((state) => {
    persist(state.entries, monthlyGoal)
    return { monthlyGoal }
  })
}))
