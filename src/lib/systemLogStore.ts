import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type LogLevel = 'info' | 'warning' | 'error'

export interface SystemLog {
  id: string
  level: LogLevel
  source: string
  message: string
  details: string
  createdAt: string
}

interface SystemLogState {
  logs: SystemLog[]
  addLog: (log: Omit<SystemLog, 'id' | 'createdAt'>) => void
  clearLogs: () => void
}

const initial = loadLocal<SystemLog[]>('system_logs', [])

export const useSystemLogStore = create<SystemLogState>((set) => ({
  logs: initial,

  addLog: (data) => set((state) => {
    const logs = [{
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }, ...state.logs].slice(0, 1000)

    saveLocal('system_logs', logs)
    return { logs }
  }),

  clearLogs: () => {
    saveLocal('system_logs', [])
    set({ logs: [] })
  }
}))

export function logSystem(
  level: LogLevel,
  source: string,
  message: string,
  details = ''
): void {
  useSystemLogStore.getState().addLog({ level, source, message, details })
}
