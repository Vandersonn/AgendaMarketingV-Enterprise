import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { trashRecord } from './trashStore'

export type SalesPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SalesStatus = 'prospecting' | 'qualification' | 'diagnosis' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface SalesOpportunity {
  id: string
  title: string
  contact: string
  company: string
  email: string
  phone: string
  value: number
  probability: number
  status: SalesStatus
  priority: SalesPriority
  source: string
  owner: string
  expectedClose: string
  nextStep: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface SalesTask {
  id: string
  opportunityId?: string
  title: string
  dueDate: string
  completed: boolean
  priority: SalesPriority
}

interface SalesState {
  opportunities: SalesOpportunity[]
  tasks: SalesTask[]
  monthlyGoal: number
  addOpportunity: (data: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateOpportunity: (opportunity: SalesOpportunity) => void
  deleteOpportunity: (id: string) => void
  addTask: (data: Omit<SalesTask, 'id' | 'completed'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  setMonthlyGoal: (value: number) => void
}

const today = new Date()
const dateAfter = (days: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const defaultOpportunities: SalesOpportunity[] = [
  { id: 'sale_1', title: 'Gestão de tráfego e conteúdo', contact: 'Mariana Souza', company: 'Clínica Vital', email: 'mariana@clinicavital.com', phone: '(31) 99999-1111', value: 4800, probability: 75, status: 'negotiation', priority: 'high', source: 'Instagram', owner: 'Vanderson de Castro', expectedClose: dateAfter(5), nextStep: 'Aprovar condições e enviar contrato', notes: 'Plano trimestral com mídia paga.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sale_2', title: 'Site institucional WordPress', contact: 'Carlos Mendes', company: 'Mendes Advocacia', email: 'carlos@mendes.adv.br', phone: '(11) 98888-4412', value: 6500, probability: 55, status: 'proposal', priority: 'high', source: 'Indicação', owner: 'Vanderson de Castro', expectedClose: dateAfter(12), nextStep: 'Follow-up da proposta comercial', notes: 'Cliente quer lançamento em 30 dias.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sale_3', title: 'Social media mensal', contact: 'Ana Ribeiro', company: 'Studio Essenza', email: 'ana@essenza.com.br', phone: '(21) 97777-3020', value: 2200, probability: 35, status: 'diagnosis', priority: 'medium', source: 'Google', owner: 'Vanderson de Castro', expectedClose: dateAfter(18), nextStep: 'Realizar reunião de diagnóstico', notes: 'Foco em posicionamento premium.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sale_4', title: 'Landing page de lançamento', contact: 'Ricardo Alves', company: 'EducaPro', email: 'ricardo@educapro.com', phone: '(41) 96666-8890', value: 3900, probability: 90, status: 'won', priority: 'medium', source: 'WhatsApp', owner: 'Vanderson de Castro', expectedClose: dateAfter(-3), nextStep: 'Iniciar onboarding', notes: 'Contrato aprovado.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
]

const defaultTasks: SalesTask[] = [
  { id: 'task_1', opportunityId: 'sale_1', title: 'Enviar contrato para Clínica Vital', dueDate: dateAfter(1), completed: false, priority: 'urgent' },
  { id: 'task_2', opportunityId: 'sale_2', title: 'Fazer follow-up com Carlos', dueDate: dateAfter(2), completed: false, priority: 'high' },
  { id: 'task_3', opportunityId: 'sale_3', title: 'Preparar diagnóstico do Studio Essenza', dueDate: dateAfter(4), completed: false, priority: 'medium' }
]

const saved = loadLocal<Pick<SalesState, 'opportunities' | 'tasks' | 'monthlyGoal'>>('sales_professional_data', {
  opportunities: defaultOpportunities,
  tasks: defaultTasks,
  monthlyGoal: 25000
})

const persist = (state: Pick<SalesState, 'opportunities' | 'tasks' | 'monthlyGoal'>) => saveLocal('sales_professional_data', state)

export const useSalesStore = create<SalesState>((set) => ({
  ...saved,
  addOpportunity: (data) => set((state) => {
    const now = new Date().toISOString()
    const opportunities = [{ ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...state.opportunities]
    persist({ ...state, opportunities })
    return { opportunities }
  }),
  updateOpportunity: (opportunity) => set((state) => {
    const opportunities = state.opportunities.map((item) => item.id === opportunity.id ? { ...opportunity, updatedAt: new Date().toISOString() } : item)
    persist({ ...state, opportunities })
    return { opportunities }
  }),
  deleteOpportunity: (id) => set((state) => {
    const opportunity = state.opportunities.find((item) => item.id === id)
    const relatedTasks = state.tasks.filter((item) => item.opportunityId === id)
    if (opportunity) trashRecord({ entityType: 'opportunity', entityId: id, title: opportunity.title, storageKey: 'sales_professional_data', collection: 'opportunities', payload: opportunity, related: [{ collection: 'tasks', payload: relatedTasks }], deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const opportunities = state.opportunities.filter((item) => item.id !== id)
    const tasks = state.tasks.filter((item) => item.opportunityId !== id)
    persist({ ...state, opportunities, tasks })
    return { opportunities, tasks }
  }),
  addTask: (data) => set((state) => {
    const tasks = [{ ...data, id: crypto.randomUUID(), completed: false }, ...state.tasks]
    persist({ ...state, tasks })
    return { tasks }
  }),
  toggleTask: (id) => set((state) => {
    const tasks = state.tasks.map((item) => item.id === id ? { ...item, completed: !item.completed } : item)
    persist({ ...state, tasks })
    return { tasks }
  }),
  deleteTask: (id) => set((state) => {
    const task = state.tasks.find((item) => item.id === id)
    if (task) trashRecord({ entityType: 'sales_task', entityId: id, title: task.title, storageKey: 'sales_professional_data', collection: 'tasks', payload: task, deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const tasks = state.tasks.filter((item) => item.id !== id)
    persist({ ...state, tasks })
    return { tasks }
  }),
  setMonthlyGoal: (monthlyGoal) => set((state) => {
    persist({ ...state, monthlyGoal })
    return { monthlyGoal }
  })
}))
