import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'
import { useEventBusStore } from './eventBusStore'

export type MissionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type MissionPriority = 'low' | 'medium' | 'high' | 'critical'

export interface MissionStep {
  id: string
  title: string
  completed: boolean
  owner: string
  dueDate: string
}

export interface BusinessMission {
  id: string
  title: string
  objective: string
  area: 'commercial' | 'financial' | 'marketing' | 'projects' | 'support' | 'executive'
  status: MissionStatus
  priority: MissionPriority
  targetValue: number
  currentValue: number
  unit: string
  dueDate: string
  owner: string
  steps: MissionStep[]
  createdAt: string
  updatedAt: string
}

interface MissionsState {
  missions: BusinessMission[]
  addMission: (mission: Omit<BusinessMission, 'id' | 'status' | 'currentValue' | 'createdAt' | 'updatedAt'>) => void
  updateProgress: (id: string, currentValue: number) => void
  toggleStep: (missionId: string, stepId: string) => void
  setStatus: (id: string, status: MissionStatus) => void
  removeMission: (id: string) => void
}

const initial = loadLocal<BusinessMission[]>('business_missions', [])

function persist(missions: BusinessMission[]) {
  saveLocal('business_missions', missions)
}

export const useMissionsStore = create<MissionsState>((set) => ({
  missions: Array.isArray(initial) ? initial : [],

  addMission: (data) => set((state) => {
    const now = new Date().toISOString()
    const mission: BusinessMission = {
      ...data,
      id: crypto.randomUUID(),
      status: 'active',
      currentValue: 0,
      steps: data.steps.map((step) => ({ ...step, id: step.id || crypto.randomUUID() })),
      createdAt: now,
      updatedAt: now
    }
    const missions = [mission, ...state.missions]
    persist(missions)
    useEventBusStore.getState().publish({
      type: 'mission.created',
      title: `Missão criada: ${mission.title}`,
      description: mission.objective,
      source: 'Central de Missões',
      entityId: mission.id,
      payload: { area: mission.area, priority: mission.priority }
    })
    return { missions }
  }),

  updateProgress: (id, currentValue) => set((state) => {
    const missions = state.missions.map((item) => {
      if (item.id !== id) return item
      const completed = item.targetValue > 0 && currentValue >= item.targetValue
      if (completed && item.status !== 'completed') {
        useEventBusStore.getState().publish({
          type: 'mission.completed',
          title: `Missão concluída: ${item.title}`,
          description: `Meta atingida: ${currentValue} ${item.unit}`,
          source: 'Central de Missões',
          entityId: item.id,
          payload: { targetValue: item.targetValue, currentValue }
        })
      }
      return {
        ...item,
        currentValue,
        status: completed ? 'completed' as const : item.status,
        updatedAt: new Date().toISOString()
      }
    })
    persist(missions)
    return { missions }
  }),

  toggleStep: (missionId, stepId) => set((state) => {
    const missions = state.missions.map((mission) => mission.id === missionId ? {
      ...mission,
      steps: mission.steps.map((step) => step.id === stepId ? { ...step, completed: !step.completed } : step),
      updatedAt: new Date().toISOString()
    } : mission)
    persist(missions)
    return { missions }
  }),

  setStatus: (id, status) => set((state) => {
    const missions = state.missions.map((item) => item.id === id ? {
      ...item,
      status,
      updatedAt: new Date().toISOString()
    } : item)
    persist(missions)
    logSystem('info', 'Missões', 'Status da missão alterado', `${id}: ${status}`)
    return { missions }
  }),

  removeMission: (id) => set((state) => {
    const missions = state.missions.filter((item) => item.id !== id)
    persist(missions)
    return { missions }
  })
}))
