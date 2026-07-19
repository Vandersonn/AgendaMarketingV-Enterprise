import type { Client, Lead } from './crmTypes'
import type { FinanceEntry } from './financeStore'
import type { Contract } from './contractsStore'
import type { Project } from './projectsStore'
import type { SupportTicket } from './supportStore'
import type { WorkTask } from './tasksStore'

export interface ExecutiveMetrics {
  revenue: number
  expenses: number
  profit: number
  pendingRevenue: number
  overdueRevenue: number
  pipeline: number
  conversionRate: number
  averageTicket: number
  activeClients: number
  atRiskClients: number
  activeContracts: number
  expiringContracts: number
  activeProjects: number
  criticalProjects: number
  overdueTasks: number
  openTickets: number
  slaBreaches: number
  cac: number
  ltv: number
  churnRate: number
  forecast30: number
  forecast90: number
}

export interface PredictionAlert {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical' | 'opportunity'
  path: string
}

export function calculateExecutiveMetrics(input: {
  clients: Client[]
  leads: Lead[]
  finance: FinanceEntry[]
  contracts: Contract[]
  projects: Project[]
  tasks: WorkTask[]
  tickets: SupportTicket[]
}): ExecutiveMetrics {
  const now = new Date()
  const paidIncome = input.finance.filter((item) => item.type === 'income' && item.status === 'paid')
  const paidExpenses = input.finance.filter((item) => item.type === 'expense' && item.status === 'paid')
  const pendingIncome = input.finance.filter((item) => item.type === 'income' && item.status === 'pending')
  const overdueIncome = input.finance.filter((item) => item.type === 'income' && item.status === 'overdue')

  const revenue = paidIncome.reduce((sum, item) => sum + item.value, 0)
  const expenses = paidExpenses.reduce((sum, item) => sum + item.value, 0)
  const pendingRevenue = pendingIncome.reduce((sum, item) => sum + item.value, 0)
  const overdueRevenue = overdueIncome.reduce((sum, item) => sum + item.value, 0)

  const won = input.leads.filter((lead) => lead.stage === 'won')
  const closed = input.leads.filter((lead) => ['won', 'lost'].includes(lead.stage))
  const openLeads = input.leads.filter((lead) => !['won', 'lost'].includes(lead.stage))
  const pipeline = openLeads.reduce((sum, item) => sum + item.value, 0)

  const activeContracts = input.contracts.filter((item) => item.status === 'active')
  const expiringContracts = activeContracts.filter((item) => {
    if (!item.endDate) return false
    const days = (new Date(item.endDate).getTime() - now.getTime()) / 86400000
    return days >= 0 && days <= item.noticeDays
  })

  const criticalProjects = input.projects.filter((item) => item.health === 'critical')
  const activeProjects = input.projects.filter((item) => item.status === 'active')
  const overdueTasks = input.tasks.filter((item) =>
    item.status !== 'done' && item.dueDate && new Date(`${item.dueDate}T23:59:59`) < now
  )
  const openTickets = input.tickets.filter((item) => !['resolved', 'closed'].includes(item.status))
  const slaBreaches = openTickets.filter((item) => new Date(item.dueAt) < now)

  const clientRevenue = input.clients.map((client) => ({
    client,
    revenue: paidIncome.filter((item) => item.clientId === client.id).reduce((sum, item) => sum + item.value, 0),
    overdue: overdueIncome.filter((item) => item.clientId === client.id).length,
    contract: activeContracts.some((item) => item.clientId === client.id)
  }))
  const atRiskClients = clientRevenue.filter((item) => item.overdue > 0 || !item.contract).length

  const marketingSpend = paidExpenses
    .filter((item) => /marketing|tráfego|ads|anúncio/i.test(`${item.category} ${item.description}`))
    .reduce((sum, item) => sum + item.value, 0)
  const acquiredClients = Math.max(1, input.clients.length)
  const cac = marketingSpend / acquiredClients
  const averageTicket = won.length ? won.reduce((sum, item) => sum + item.value, 0) / won.length : 0
  const ltv = input.clients.length ? revenue / input.clients.length : 0
  const cancelledContracts = input.contracts.filter((item) => item.status === 'cancelled').length
  const churnRate = input.contracts.length ? (cancelledContracts / input.contracts.length) * 100 : 0

  const recurringMonthly = activeContracts
    .filter((item) => item.autoRenew)
    .reduce((sum, item) => sum + item.value, 0)
  const expectedPipeline = pipeline * (closed.length ? won.length / closed.length : 0.25)
  const forecast30 = recurringMonthly + pendingRevenue + expectedPipeline
  const forecast90 = recurringMonthly * 3 + pendingRevenue + expectedPipeline * 1.8

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    pendingRevenue,
    overdueRevenue,
    pipeline,
    conversionRate: closed.length ? (won.length / closed.length) * 100 : 0,
    averageTicket,
    activeClients: input.clients.length,
    atRiskClients,
    activeContracts: activeContracts.length,
    expiringContracts: expiringContracts.length,
    activeProjects: activeProjects.length,
    criticalProjects: criticalProjects.length,
    overdueTasks: overdueTasks.length,
    openTickets: openTickets.length,
    slaBreaches: slaBreaches.length,
    cac,
    ltv,
    churnRate,
    forecast30,
    forecast90
  }
}

export function generatePredictionAlerts(metrics: ExecutiveMetrics): PredictionAlert[] {
  const alerts: PredictionAlert[] = []

  if (metrics.overdueRevenue > 0) {
    alerts.push({
      id: 'overdue-revenue',
      title: 'Receita em risco',
      description: `${metrics.overdueRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} estão vencidos.`,
      severity: 'critical',
      path: '/finance'
    })
  }

  if (metrics.expiringContracts > 0) {
    alerts.push({
      id: 'expiring-contracts',
      title: 'Renovações próximas',
      description: `${metrics.expiringContracts} contrato(s) precisam de negociação de renovação.`,
      severity: 'warning',
      path: '/contracts'
    })
  }

  if (metrics.criticalProjects > 0 || metrics.overdueTasks > 0) {
    alerts.push({
      id: 'delivery-risk',
      title: 'Risco operacional',
      description: `${metrics.criticalProjects} projeto(s) crítico(s) e ${metrics.overdueTasks} tarefa(s) atrasada(s).`,
      severity: 'critical',
      path: '/projects'
    })
  }

  if (metrics.atRiskClients > 0) {
    alerts.push({
      id: 'client-risk',
      title: 'Clientes em risco',
      description: `${metrics.atRiskClients} cliente(s) apresentam inadimplência ou ausência de contrato ativo.`,
      severity: 'warning',
      path: '/client-health'
    })
  }

  if (metrics.pipeline > 0) {
    alerts.push({
      id: 'pipeline-opportunity',
      title: 'Potencial de fechamento',
      description: `O pipeline atual soma ${metrics.pipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      severity: 'opportunity',
      path: '/crm'
    })
  }

  if (metrics.churnRate > 15) {
    alerts.push({
      id: 'high-churn',
      title: 'Churn elevado',
      description: `A taxa estimada de cancelamento está em ${metrics.churnRate.toFixed(1)}%.`,
      severity: 'critical',
      path: '/client-health'
    })
  }

  return alerts
}
