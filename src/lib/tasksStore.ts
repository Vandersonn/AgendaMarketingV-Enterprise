import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

export type TaskStatus = 'backlog' | 'doing' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkTask {
  id: string
  title: string
  description: string
  clientId?: string
  assigneeEmail: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  createdAt: string
}

interface TasksState {
  tasks: WorkTask[]
  addTask: (task: Omit<WorkTask, 'id' | 'createdAt'>) => void
  moveTask: (id: string, status: TaskStatus) => void
  removeTask: (id: string) => void
}

const initial = loadLocal<WorkTask[]>('work_tasks', [])

function persist(tasks: WorkTask[]) {
  saveLocal('work_tasks', tasks)
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: initial,

  addTask: (data) => set((state) => {
    const task = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
    const tasks = [task, ...state.tasks]
    persist(tasks)
    useAuditStore.getState().log({
      action: 'create',
      module: 'Tarefas',
      description: `Tarefa ${task.title} criada.`,
      user: 'Vanderson de Castro'
    })
    return { tasks }
  }),

  moveTask: (id, status) => set((state) => {
    const tasks = state.tasks.map((item) => item.id === id ? { ...item, status } : item)
    persist(tasks)
    return { tasks }
  }),

  removeTask: (id) => set((state) => {
    const tasks = state.tasks.filter((item) => item.id !== id)
    persist(tasks)
    return { tasks }
  })
}))
