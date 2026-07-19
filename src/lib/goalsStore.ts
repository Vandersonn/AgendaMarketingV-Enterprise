import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface KeyResult {
  id: string
  title: string
  current: number
  target: number
  unit: string
}

export interface Objective {
  id: string
  title: string
  ownerEmail: string
  period: string
  status: 'active' | 'completed' | 'cancelled'
  keyResults: KeyResult[]
  createdAt: string
}

interface GoalsState {
  objectives: Objective[]
  addObjective: (data: Omit<Objective, 'id' | 'createdAt' | 'keyResults'>) => void
  removeObjective: (id: string) => void
  addKeyResult: (objectiveId: string, data: Omit<KeyResult, 'id' | 'current'>) => void
  updateKeyResult: (objectiveId: string, keyResultId: string, current: number) => void
}

const initial = loadLocal<Objective[]>('objectives', [])

function persist(objectives: Objective[]) {
  saveLocal('objectives', objectives)
}

export const useGoalsStore = create<GoalsState>((set) => ({
  objectives: initial,

  addObjective: (data) => set((state) => {
    const objectives = [{
      ...data,
      id: crypto.randomUUID(),
      keyResults: [],
      createdAt: new Date().toISOString()
    }, ...state.objectives]
    persist(objectives)
    return { objectives }
  }),

  removeObjective: (id) => set((state) => {
    const objectives = state.objectives.filter((item) => item.id !== id)
    persist(objectives)
    return { objectives }
  }),

  addKeyResult: (objectiveId, data) => set((state) => {
    const objectives = state.objectives.map((item) => item.id === objectiveId ? {
      ...item,
      keyResults: [...item.keyResults, { ...data, id: crypto.randomUUID(), current: 0 }]
    } : item)
    persist(objectives)
    return { objectives }
  }),

  updateKeyResult: (objectiveId, keyResultId, current) => set((state) => {
    const objectives = state.objectives.map((item) => item.id === objectiveId ? {
      ...item,
      keyResults: item.keyResults.map((keyResult) => keyResult.id === keyResultId ? { ...keyResult, current } : keyResult)
    } : item)
    persist(objectives)
    return { objectives }
  })
}))
