import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed'
export type ProjectHealth = 'healthy' | 'attention' | 'critical'

export interface ProjectMilestone {
  id: string
  title: string
  dueDate: string
  completed: boolean
}

export interface Project {
  id: string
  name: string
  clientId?: string
  ownerEmail: string
  startDate: string
  endDate: string
  budget: number
  status: ProjectStatus
  progress: number
  health: ProjectHealth
  description: string
  milestones: ProjectMilestone[]
  createdAt: string
}

interface ProjectsState {
  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'milestones'>) => void
  removeProject: (id: string) => void
  setProgress: (id: string, progress: number) => void
  setStatus: (id: string, status: ProjectStatus) => void
  addMilestone: (projectId: string, milestone: Omit<ProjectMilestone, 'id' | 'completed'>) => void
  toggleMilestone: (projectId: string, milestoneId: string) => void
}

const initial = loadLocal<Project[]>('projects', [])

function persist(projects: Project[]) {
  saveLocal('projects', projects)
}

function healthFrom(progress: number, endDate: string): ProjectHealth {
  if (!endDate) return 'healthy'
  const daysLeft = Math.ceil((new Date(`${endDate}T23:59:59`).getTime() - Date.now()) / 86400000)
  if (daysLeft < 0 && progress < 100) return 'critical'
  if (daysLeft <= 7 && progress < 80) return 'attention'
  return 'healthy'
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: initial,

  addProject: (data) => set((state) => {
    const project: Project = {
      ...data,
      id: crypto.randomUUID(),
      milestones: [],
      health: healthFrom(data.progress, data.endDate),
      createdAt: new Date().toISOString()
    }
    const projects = [project, ...state.projects]
    persist(projects)
    useAuditStore.getState().log({
      action: 'create',
      module: 'Projetos',
      description: `Projeto ${project.name} criado.`,
      user: 'Vanderson de Castro'
    })
    return { projects }
  }),

  removeProject: (id) => set((state) => {
    const projects = state.projects.filter((item) => item.id !== id)
    persist(projects)
    return { projects }
  }),

  setProgress: (id, progress) => set((state) => {
    const projects = state.projects.map((item) =>
      item.id === id
        ? { ...item, progress, health: healthFrom(progress, item.endDate), status: progress >= 100 ? 'completed' as const : item.status }
        : item
    )
    persist(projects)
    return { projects }
  }),

  setStatus: (id, status) => set((state) => {
    const projects = state.projects.map((item) => item.id === id ? { ...item, status } : item)
    persist(projects)
    return { projects }
  }),

  addMilestone: (projectId, data) => set((state) => {
    const projects = state.projects.map((item) => item.id === projectId ? {
      ...item,
      milestones: [...item.milestones, { ...data, id: crypto.randomUUID(), completed: false }]
    } : item)
    persist(projects)
    return { projects }
  }),

  toggleMilestone: (projectId, milestoneId) => set((state) => {
    const projects = state.projects.map((item) => item.id === projectId ? {
      ...item,
      milestones: item.milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone
      )
    } : item)
    persist(projects)
    return { projects }
  })
}))
