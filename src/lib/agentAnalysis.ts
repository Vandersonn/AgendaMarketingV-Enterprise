import type { AgentInsight, AgentType } from './aiAgentsStore'
import type { CalendarEvent } from './calendarStore'
import type { Contract } from './contractsStore'
import type { FinanceEntry } from './financeStore'
import type { ContentItem } from './marketingStore'
import type { Project } from './projectsStore'
import type { SupportTicket } from './supportStore'
import type { WorkTask } from './tasksStore'
import type { Client, Lead } from './crmTypes'

type InsightDraft = Omit<AgentInsight, 'id' | 'createdAt' | 'dismissed'>

export interface AgentData {
  clients: Client[]
  leads: Lead[]
  finance: FinanceEntry[]
  contents: ContentItem[]
  projects: Project[]
  tasks: WorkTask[]
  tickets: SupportTicket[]
  contracts: Contract[]
  events: CalendarEvent[]
}

function insight(
  agent: AgentType,
  title: string,
  description: string,
  severity: InsightDraft['severity'],
  path: string,
  fingerprint: string
): InsightDraft {
  return { agent, title, description, severity, path, fingerprint }
}

export function analyzeAgent(agent: AgentType, data: AgentData): {
  insights: InsightDraft[]
  metrics: Record<string, number>
} {
  const now = new Date()
  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const insights: InsightDraft[] = []

  if (agent === 'commercial') {
    const openLeads = data.leads.filter((lead) => !['won', 'lost'].includes(lead.stage))
    const staleLeads = openLeads.filter((lead) => new Date(lead.updatedAt).getTime() < thirtyDaysAgo)
    const pipeline = openLeads.reduce((sum, lead) => sum + lead.value, 0)
    const followUps = openLeads.filter((lead) => Boolean(lead.nextAction))

    if (staleLeads.length) {
      insights.push(insight(
        agent,
        'Leads sem movimentação',
        `${staleLeads.length} oportunidade(s) estão sem atualização há mais de 30 dias.`,
        'warning',
        '/crm',
        `commercial-stale-${staleLeads.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (followUps.length) {
      insights.push(insight(
        agent,
        'Acompanhamentos prontos para execução',
        `${followUps.length} lead(s) possuem próxima ação cadastrada.`,
        'opportunity',
        '/crm',
        `commercial-followup-${followUps.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (pipeline > 0) {
      insights.push(insight(
        agent,
        'Pipeline comercial ativo',
        `Existem ${pipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em oportunidades abertas.`,
        'info',
        '/crm',
        `commercial-pipeline-${Math.round(pipeline)}`
      ))
    }

    return { insights, metrics: { openLeads: openLeads.length, staleLeads: staleLeads.length, pipeline } }
  }

  if (agent === 'financial') {
    const received = data.finance
      .filter((item) => item.type === 'income' && item.status === 'paid')
      .reduce((sum, item) => sum + item.value, 0)
    const expenses = data.finance
      .filter((item) => item.type === 'expense' && item.status === 'paid')
      .reduce((sum, item) => sum + item.value, 0)
    const overdue = data.finance.filter((item) => item.status === 'overdue')
    const pendingIncome = data.finance
      .filter((item) => item.type === 'income' && item.status === 'pending')
      .reduce((sum, item) => sum + item.value, 0)

    if (overdue.length) {
      const total = overdue.reduce((sum, item) => sum + item.value, 0)
      insights.push(insight(
        agent,
        'Cobranças vencidas',
        `${overdue.length} lançamento(s) vencido(s), totalizando ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
        'critical',
        '/finance',
        `financial-overdue-${overdue.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (pendingIncome > 0) {
      insights.push(insight(
        agent,
        'Receita prevista',
        `${pendingIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} aguardam recebimento.`,
        'opportunity',
        '/finance',
        `financial-pending-${Math.round(pendingIncome)}`
      ))
    }

    if (expenses > received && expenses > 0) {
      insights.push(insight(
        agent,
        'Despesas acima das receitas',
        'As despesas pagas superam as receitas recebidas no histórico atual.',
        'critical',
        '/finance',
        `financial-negative-${Math.round(expenses - received)}`
      ))
    }

    return { insights, metrics: { received, expenses, overdue: overdue.length, pendingIncome, balance: received - expenses } }
  }

  if (agent === 'marketing') {
    const review = data.contents.filter((item) => item.status === 'review')
    const scheduled = data.contents.filter((item) => item.status === 'scheduled')
    const publishedRecent = data.contents.filter(
      (item) => item.status === 'published' && new Date(item.createdAt).getTime() >= thirtyDaysAgo
    )

    if (review.length) {
      insights.push(insight(
        agent,
        'Conteúdos aguardando aprovação',
        `${review.length} conteúdo(s) precisam de revisão ou retorno do cliente.`,
        'warning',
        '/approvals',
        `marketing-review-${review.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (scheduled.length < 3) {
      insights.push(insight(
        agent,
        'Calendário com baixa programação',
        `Existem apenas ${scheduled.length} conteúdo(s) agendado(s). Planeje novas publicações.`,
        'opportunity',
        '/content-calendar',
        `marketing-scheduled-${scheduled.length}`
      ))
    }

    if (!publishedRecent.length && data.contents.length) {
      insights.push(insight(
        agent,
        'Baixa atividade de publicação',
        'Nenhum conteúdo recente foi marcado como publicado nos últimos 30 dias.',
        'warning',
        '/marketing',
        'marketing-no-recent-published'
      ))
    }

    return { insights, metrics: { review: review.length, scheduled: scheduled.length, publishedRecent: publishedRecent.length } }
  }

  if (agent === 'projects') {
    const critical = data.projects.filter((item) => item.health === 'critical')
    const attention = data.projects.filter((item) => item.health === 'attention')
    const overdueTasks = data.tasks.filter(
      (item) => item.status !== 'done' && item.dueDate && new Date(`${item.dueDate}T23:59:59`) < now
    )
    const overloaded = Object.entries(
      data.tasks
        .filter((item) => item.status !== 'done')
        .reduce<Record<string, number>>((acc, item) => {
          acc[item.assigneeEmail] = (acc[item.assigneeEmail] ?? 0) + 1
          return acc
        }, {})
    ).filter(([, count]) => count >= 8)

    if (critical.length) {
      insights.push(insight(
        agent,
        'Projetos críticos',
        `${critical.length} projeto(s) estão atrasados ou com progresso incompatível com o prazo.`,
        'critical',
        '/projects',
        `projects-critical-${critical.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (attention.length) {
      insights.push(insight(
        agent,
        'Projetos precisam de atenção',
        `${attention.length} projeto(s) estão próximos do prazo com progresso baixo.`,
        'warning',
        '/projects',
        `projects-attention-${attention.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (overdueTasks.length) {
      insights.push(insight(
        agent,
        'Tarefas atrasadas',
        `${overdueTasks.length} tarefa(s) precisam ser replanejadas ou concluídas.`,
        'critical',
        '/tasks',
        `projects-tasks-${overdueTasks.map((item) => item.id).sort().join('-')}`
      ))
    }

    if (overloaded.length) {
      insights.push(insight(
        agent,
        'Possível sobrecarga da equipe',
        overloaded.map(([email, count]) => `${email}: ${count} tarefas`).join(' • '),
        'warning',
        '/tasks',
        `projects-overload-${overloaded.map(([email, count]) => `${email}-${count}`).join('-')}`
      ))
    }

    return { insights, metrics: { critical: critical.length, attention: attention.length, overdueTasks: overdueTasks.length, overloaded: overloaded.length } }
  }

  const openTickets = data.tickets.filter((item) => !['resolved', 'closed'].includes(item.status))
  const slaOverdue = openTickets.filter((item) => new Date(item.dueAt) < now)
  const ratings = data.tickets.filter((item) => item.rating).map((item) => item.rating ?? 0)
  const averageRating = ratings.length ? ratings.reduce((sum, item) => sum + item, 0) / ratings.length : 0

  if (slaOverdue.length) {
    insights.push(insight(
      agent,
      'SLA vencido',
      `${slaOverdue.length} chamado(s) ultrapassaram o prazo de atendimento.`,
      'critical',
      '/support',
      `support-sla-${slaOverdue.map((item) => item.id).sort().join('-')}`
    ))
  }

  if (openTickets.length >= 5) {
    insights.push(insight(
      agent,
      'Fila de suporte elevada',
      `${openTickets.length} chamados permanecem abertos ou em atendimento.`,
      'warning',
      '/support',
      `support-open-${openTickets.length}`
    ))
  }

  if (averageRating && averageRating < 4) {
    insights.push(insight(
      agent,
      'Satisfação abaixo do desejado',
      `A avaliação média do suporte está em ${averageRating.toFixed(1)} de 5.`,
      'warning',
      '/support',
      `support-rating-${averageRating.toFixed(1)}`
    ))
  }

  return { insights, metrics: { openTickets: openTickets.length, slaOverdue: slaOverdue.length, averageRating } }
}
