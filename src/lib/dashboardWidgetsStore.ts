import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type WidgetId =
  | 'revenue'
  | 'pipeline'
  | 'clients'
  | 'tasks'
  | 'projects'
  | 'support'
  | 'forecast'
  | 'alerts'
  | 'timeline'

export interface DashboardWidget {
  id: WidgetId
  title: string
  visible: boolean
  order: number
  size: 'small' | 'medium' | 'large'
}

interface DashboardWidgetsState {
  widgets: DashboardWidget[]
  toggle: (id: WidgetId) => void
  move: (id: WidgetId, direction: 'up' | 'down') => void
  resize: (id: WidgetId, size: DashboardWidget['size']) => void
  reset: () => void
}

const defaults: DashboardWidget[] = [
  { id: 'revenue', title: 'Receita e lucro', visible: true, order: 0, size: 'medium' },
  { id: 'pipeline', title: 'Pipeline comercial', visible: true, order: 1, size: 'small' },
  { id: 'clients', title: 'Clientes', visible: true, order: 2, size: 'small' },
  { id: 'tasks', title: 'Tarefas', visible: true, order: 3, size: 'small' },
  { id: 'projects', title: 'Projetos', visible: true, order: 4, size: 'small' },
  { id: 'support', title: 'Suporte', visible: true, order: 5, size: 'small' },
  { id: 'forecast', title: 'Previsão', visible: true, order: 6, size: 'medium' },
  { id: 'alerts', title: 'Alertas executivos', visible: true, order: 7, size: 'medium' },
  { id: 'timeline', title: 'Timeline global', visible: true, order: 8, size: 'large' }
]

const initial = loadLocal<DashboardWidget[]>('dashboard_widgets', defaults)

function persist(widgets: DashboardWidget[]) {
  saveLocal('dashboard_widgets', widgets)
}

export const useDashboardWidgetsStore = create<DashboardWidgetsState>((set) => ({
  widgets: Array.isArray(initial) && initial.length ? initial : defaults,

  toggle: (id) => set((state) => {
    const widgets = state.widgets.map((item) => item.id === id ? { ...item, visible: !item.visible } : item)
    persist(widgets)
    return { widgets }
  }),

  move: (id, direction) => set((state) => {
    const ordered = [...state.widgets].sort((a, b) => a.order - b.order)
    const index = ordered.findIndex((item) => item.id === id)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= ordered.length) return state

    const currentOrder = ordered[index].order
    ordered[index] = { ...ordered[index], order: ordered[target].order }
    ordered[target] = { ...ordered[target], order: currentOrder }
    persist(ordered)
    return { widgets: ordered }
  }),

  resize: (id, size) => set((state) => {
    const widgets = state.widgets.map((item) => item.id === id ? { ...item, size } : item)
    persist(widgets)
    return { widgets }
  }),

  reset: () => {
    persist(defaults)
    set({ widgets: defaults })
  }
}))
