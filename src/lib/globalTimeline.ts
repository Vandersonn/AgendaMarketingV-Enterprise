import type { CalendarEvent } from './calendarStore'
import type { Contract } from './contractsStore'
import type { FinanceEntry } from './financeStore'
import type { ContentItem } from './marketingStore'
import type { Project } from './projectsStore'
import type { SupportTicket } from './supportStore'
import type { WorkTask } from './tasksStore'
import type { Lead } from './crmTypes'

export interface GlobalTimelineItem {
  id: string
  type: 'crm' | 'finance' | 'contract' | 'project' | 'task' | 'support' | 'marketing' | 'calendar'
  title: string
  description: string
  createdAt: string
  path: string
}

export function buildGlobalTimeline(input: {
  leads: Lead[]
  finance: FinanceEntry[]
  contracts: Contract[]
  projects: Project[]
  tasks: WorkTask[]
  tickets: SupportTicket[]
  contents: ContentItem[]
  events: CalendarEvent[]
}): GlobalTimelineItem[] {
  const items: GlobalTimelineItem[] = [
    ...input.leads.map((item) => ({
      id: `lead-${item.id}`,
      type: 'crm' as const,
      title: `Lead: ${item.name}`,
      description: `Etapa ${item.stage} • ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      createdAt: item.updatedAt,
      path: '/crm'
    })),
    ...input.finance.map((item) => ({
      id: `finance-${item.id}`,
      type: 'finance' as const,
      title: item.description,
      description: `${item.type === 'income' ? 'Receita' : 'Despesa'} • ${item.status}`,
      createdAt: item.createdAt,
      path: '/finance'
    })),
    ...input.contracts.map((item) => ({
      id: `contract-${item.id}`,
      type: 'contract' as const,
      title: item.title,
      description: `Contrato ${item.status}`,
      createdAt: item.createdAt,
      path: '/contracts'
    })),
    ...input.projects.map((item) => ({
      id: `project-${item.id}`,
      type: 'project' as const,
      title: item.name,
      description: `Projeto ${item.status} • ${item.progress}%`,
      createdAt: item.createdAt,
      path: '/projects'
    })),
    ...input.tasks.map((item) => ({
      id: `task-${item.id}`,
      type: 'task' as const,
      title: item.title,
      description: `Tarefa ${item.status}`,
      createdAt: item.createdAt,
      path: '/tasks'
    })),
    ...input.tickets.map((item) => ({
      id: `ticket-${item.id}`,
      type: 'support' as const,
      title: `${item.code} — ${item.subject}`,
      description: `Suporte ${item.status}`,
      createdAt: item.updatedAt,
      path: '/support'
    })),
    ...input.contents.map((item) => ({
      id: `content-${item.id}`,
      type: 'marketing' as const,
      title: item.title,
      description: `Conteúdo ${item.status}`,
      createdAt: item.createdAt,
      path: '/marketing'
    })),
    ...input.events.map((item) => ({
      id: `event-${item.id}`,
      type: 'calendar' as const,
      title: item.title,
      description: `Agenda • ${new Date(item.start).toLocaleString('pt-BR')}`,
      createdAt: item.start,
      path: '/calendar'
    }))
  ]

  return items
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200)
}
