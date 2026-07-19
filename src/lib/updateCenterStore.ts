import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface ReleaseInfo {
  version: string
  title: string
  notes: string[]
  publishedAt: string
  mandatory: boolean
  packageUrl: string
}

interface UpdateState {
  currentVersion: string
  available: ReleaseInfo | null
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'updated' | 'error'
  progress: number
  lastCheckAt: string
  error: string
  check: () => Promise<void>
  simulateDownload: () => Promise<void>
  apply: () => void
}

const saved = loadLocal<Pick<UpdateState,'available'|'status'|'progress'|'lastCheckAt'|'error'>>('update_center', {
  available: null,
  status: 'idle',
  progress: 0,
  lastCheckAt: '',
  error: ''
})

function persist(state: Pick<UpdateState,'available'|'status'|'progress'|'lastCheckAt'|'error'>) {
  saveLocal('update_center', state)
}

export const useUpdateCenterStore = create<UpdateState>((set, get) => ({
  currentVersion: '19.0.0',
  ...saved,

  check: async () => {
    set({ status: 'checking', error: '' })
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    const available: ReleaseInfo = {
      version: '19.0.1',
      title: 'Atualização de manutenção',
      notes: ['Correções de estabilidade', 'Melhorias no dashboard', 'Otimizações de sincronização'],
      publishedAt: new Date().toISOString(),
      mandatory: false,
      packageUrl: ''
    }
    const state = { available, status: 'available' as const, progress: 0, lastCheckAt: new Date().toISOString(), error: '' }
    persist(state)
    set(state)
    logSystem('info','Atualizações','Nova versão detectada',available.version)
  },

  simulateDownload: async () => {
    if (!get().available) return
    set({ status: 'downloading', progress: 0 })
    for (let progress = 10; progress <= 100; progress += 10) {
      await new Promise((resolve) => window.setTimeout(resolve, 120))
      set({ progress })
    }
    const current = get()
    const state = { available: current.available, status: 'ready' as const, progress: 100, lastCheckAt: current.lastCheckAt, error: '' }
    persist(state)
    set(state)
  },

  apply: () => {
    const current = get()
    const state = { available: null, status: 'updated' as const, progress: 0, lastCheckAt: current.lastCheckAt, error: '' }
    persist(state)
    set(state)
    logSystem('info','Atualizações','Atualização preparada para instalação','Reinicie o aplicativo para concluir.')
  }
}))
