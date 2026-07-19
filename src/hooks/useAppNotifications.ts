import { useMemo } from 'react'
import { useCalendarStore } from '../lib/calendarStore'
import { useCrmStore } from '../lib/crmStore'
import { useFinanceStore } from '../lib/financeStore'
import { useMarketingStore } from '../lib/marketingStore'
import { useNotificationsStore, type AppNotification } from '../lib/notificationsStore'
import { useTasksStore } from '../lib/tasksStore'
import { useSupportStore } from '../lib/supportStore'

export function useAppNotifications(): AppNotification[] {
  const leads = useCrmStore((state) => state.leads)
  const contents = useMarketingStore((state) => state.contents)
  const events = useCalendarStore((state) => state.events)
  const finance = useFinanceStore((state) => state.entries)
  const tasks = useTasksStore((state) => state.tasks)
  const tickets = useSupportStore((state) => state.tickets)
  const manual = useNotificationsStore((state) => state.manual)
  const readIds = useNotificationsStore((state) => state.readIds)

  return useMemo(() => {
    const now = new Date()
    const nextSevenDays = new Date(now)
    nextSevenDays.setDate(now.getDate() + 7)

    const generated: AppNotification[] = [
      ...leads
        .filter((lead) => lead.nextAction && !['won', 'lost'].includes(lead.stage))
        .slice(0, 5)
        .map((lead) => ({
          id: `lead-${lead.id}-${lead.nextAction}`,
          title: 'Acompanhamento de Lead',
          description: `${lead.name}: ${lead.nextAction}`,
          type: 'crm' as const,
          path: '/crm',
          read: false,
          createdAt: lead.updatedAt
        })),
      ...contents
        .filter((item) => item.status === 'review')
        .slice(0, 5)
        .map((item) => ({
          id: `content-${item.id}-review`,
          title: 'Conteúdo aguardando revisão',
          description: item.title,
          type: 'marketing' as const,
          path: '/approvals',
          read: false,
          createdAt: item.createdAt
        })),
      ...events
        .filter((item) => {
          const start = new Date(item.start)
          return start >= now && start <= nextSevenDays
        })
        .slice(0, 5)
        .map((item) => ({
          id: `event-${item.id}-${item.start}`,
          title: 'Compromisso próximo',
          description: `${item.title} • ${new Date(item.start).toLocaleString('pt-BR')}`,
          type: 'calendar' as const,
          path: '/calendar',
          read: false,
          createdAt: item.start
        })),
      ...finance
        .filter((item) => item.status === 'overdue')
        .slice(0, 5)
        .map((item) => ({
          id: `finance-${item.id}-overdue`,
          title: 'Cobrança vencida',
          description: `${item.description} • ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
          type: 'finance' as const,
          path: '/finance',
          read: false,
          createdAt: item.createdAt
        })),
      ...tickets
        .filter((item) => !['resolved','closed'].includes(item.status) && new Date(item.dueAt) < now)
        .slice(0,5)
        .map((item) => ({
          id: `support-${item.id}-sla`,
          title: 'SLA de suporte vencido',
          description: `${item.code} • ${item.subject}`,
          type: 'system' as const,
          path: '/support',
          read: false,
          createdAt: item.updatedAt
        })),
      ...tasks
        .filter((item) => item.status !== 'done' && item.dueDate && new Date(`${item.dueDate}T23:59:59`) < now)
        .slice(0, 5)
        .map((item) => ({
          id: `task-${item.id}-overdue`,
          title: 'Tarefa atrasada',
          description: `${item.title} • prazo ${new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}`,
          type: 'tasks' as const,
          path: '/tasks',
          read: false,
          createdAt: item.createdAt
        }))
    ]

    return [...manual, ...generated]
      .map((item) => ({ ...item, read: item.read || readIds.includes(item.id) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [leads, contents, events, finance, tasks, tickets, manual, readIds])
}
