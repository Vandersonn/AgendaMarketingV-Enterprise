import type { ExecutiveMetrics } from './executiveAnalytics'
import type { AgentInsight } from './aiAgentsStore'

export interface ExecutiveAnswer {
  title: string
  answer: string
  evidence: string[]
  actions: string[]
  confidence: 'low' | 'medium' | 'high'
}

export interface ExecutiveBrief {
  healthScore: number
  headline: string
  summary: string
  priorities: string[]
  opportunities: string[]
  risks: string[]
}

function currency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function buildExecutiveBrief(metrics: ExecutiveMetrics, insights: AgentInsight[]): ExecutiveBrief {
  let score = 100
  if (metrics.profit < 0) score -= 25
  if (metrics.overdueRevenue > 0) score -= 15
  if (metrics.churnRate > 15) score -= 15
  if (metrics.criticalProjects > 0) score -= 15
  if (metrics.overdueTasks > 0) score -= Math.min(15, metrics.overdueTasks * 2)
  if (metrics.slaBreaches > 0) score -= Math.min(10, metrics.slaBreaches * 2)
  score = Math.max(0, score)

  const risks: string[] = []
  const opportunities: string[] = []
  const priorities: string[] = []

  if (metrics.overdueRevenue > 0) {
    risks.push(`${currency(metrics.overdueRevenue)} em receitas vencidas.`)
    priorities.push('Executar uma rotina de cobrança dos títulos vencidos.')
  }

  if (metrics.criticalProjects > 0) {
    risks.push(`${metrics.criticalProjects} projeto(s) em estado crítico.`)
    priorities.push('Revisar prazos, responsáveis e escopo dos projetos críticos.')
  }

  if (metrics.overdueTasks > 0) {
    risks.push(`${metrics.overdueTasks} tarefa(s) atrasada(s).`)
    priorities.push('Replanejar ou concluir as tarefas vencidas.')
  }

  if (metrics.pipeline > 0) {
    opportunities.push(`Pipeline comercial de ${currency(metrics.pipeline)}.`)
    priorities.push('Priorizar oportunidades com maior probabilidade de fechamento.')
  }

  if (metrics.forecast30 > metrics.revenue) {
    opportunities.push(`Previsão de ${currency(metrics.forecast30)} para os próximos 30 dias.`)
  }

  if (metrics.expiringContracts > 0) {
    priorities.push(`Negociar a renovação de ${metrics.expiringContracts} contrato(s).`)
  }

  for (const insight of insights.filter((item) => !item.dismissed).slice(0, 4)) {
    if (insight.severity === 'critical' || insight.severity === 'warning') {
      risks.push(insight.description)
    }
    if (insight.severity === 'opportunity') {
      opportunities.push(insight.description)
    }
  }

  const headline = score >= 85
    ? 'Operação saudável, com oportunidades de crescimento.'
    : score >= 65
      ? 'Operação estável, mas exige ações corretivas.'
      : 'Existem riscos relevantes que precisam de atenção imediata.'

  return {
    healthScore: score,
    headline,
    summary: `Receita acumulada de ${currency(metrics.revenue)}, lucro de ${currency(metrics.profit)} e previsão de ${currency(metrics.forecast30)} para 30 dias.`,
    priorities: [...new Set(priorities)].slice(0, 6),
    opportunities: [...new Set(opportunities)].slice(0, 6),
    risks: [...new Set(risks)].slice(0, 6)
  }
}

export function answerExecutiveQuestion(
  question: string,
  metrics: ExecutiveMetrics,
  insights: AgentInsight[]
): ExecutiveAnswer {
  const normalized = question.trim().toLowerCase()
  const evidence: string[] = []
  const actions: string[] = []
  let title = 'Análise executiva'
  let answer = 'Não encontrei uma correspondência direta. Use perguntas sobre receita, lucro, clientes, contratos, projetos, tarefas, suporte, CAC, LTV ou churn.'
  let confidence: ExecutiveAnswer['confidence'] = 'medium'

  if (/quanto.*(fatur|receita)|receita.*m[eê]s|faturamento/.test(normalized)) {
    title = 'Receita e previsão'
    answer = `A receita realizada é ${currency(metrics.revenue)}. A previsão para 30 dias é ${currency(metrics.forecast30)} e para 90 dias é ${currency(metrics.forecast90)}.`
    evidence.push(`Receita realizada: ${currency(metrics.revenue)}`)
    evidence.push(`Receita pendente: ${currency(metrics.pendingRevenue)}`)
    evidence.push(`Pipeline: ${currency(metrics.pipeline)}`)
    actions.push('Revisar os recebimentos pendentes.')
    actions.push('Priorizar oportunidades do pipeline.')
    confidence = 'high'
  } else if (/lucro|margem|despesa/.test(normalized)) {
    title = 'Resultado financeiro'
    answer = `O lucro acumulado é ${currency(metrics.profit)}, considerando ${currency(metrics.revenue)} em receitas e ${currency(metrics.expenses)} em despesas pagas.`
    evidence.push(`Receitas: ${currency(metrics.revenue)}`)
    evidence.push(`Despesas: ${currency(metrics.expenses)}`)
    evidence.push(`Inadimplência: ${currency(metrics.overdueRevenue)}`)
    if (metrics.profit < 0) actions.push('Revisar despesas e renegociar custos.')
    if (metrics.overdueRevenue > 0) actions.push('Executar cobranças dos títulos vencidos.')
    confidence = 'high'
  } else if (/cliente.*risco|churn|cancelamento/.test(normalized)) {
    title = 'Risco de clientes'
    answer = `${metrics.atRiskClients} cliente(s) estão classificados como risco operacional. O churn estimado é ${metrics.churnRate.toFixed(1)}%.`
    evidence.push(`Clientes ativos: ${metrics.activeClients}`)
    evidence.push(`Clientes em risco: ${metrics.atRiskClients}`)
    evidence.push(`Churn estimado: ${metrics.churnRate.toFixed(1)}%`)
    actions.push('Contatar clientes sem contrato ativo ou com inadimplência.')
    actions.push('Criar plano de retenção para os clientes prioritários.')
    confidence = 'high'
  } else if (/contrato|renova/.test(normalized)) {
    title = 'Contratos'
    answer = `Existem ${metrics.activeContracts} contrato(s) ativo(s), sendo ${metrics.expiringContracts} próximo(s) da renovação.`
    evidence.push(`Contratos ativos: ${metrics.activeContracts}`)
    evidence.push(`Renovações próximas: ${metrics.expiringContracts}`)
    actions.push('Agendar contato de renovação antes do prazo de aviso.')
    confidence = 'high'
  } else if (/projeto|tarefa|atras/.test(normalized)) {
    title = 'Operação e entregas'
    answer = `A operação possui ${metrics.activeProjects} projeto(s) ativo(s), ${metrics.criticalProjects} crítico(s) e ${metrics.overdueTasks} tarefa(s) atrasada(s).`
    evidence.push(`Projetos ativos: ${metrics.activeProjects}`)
    evidence.push(`Projetos críticos: ${metrics.criticalProjects}`)
    evidence.push(`Tarefas atrasadas: ${metrics.overdueTasks}`)
    actions.push('Revisar os projetos críticos.')
    actions.push('Redistribuir ou replanejar tarefas vencidas.')
    confidence = 'high'
  } else if (/suporte|sla|chamado/.test(normalized)) {
    title = 'Atendimento e SLA'
    answer = `Existem ${metrics.openTickets} chamado(s) aberto(s), com ${metrics.slaBreaches} violação(ões) de SLA.`
    evidence.push(`Chamados abertos: ${metrics.openTickets}`)
    evidence.push(`SLA vencido: ${metrics.slaBreaches}`)
    actions.push('Priorizar os chamados com prazo vencido.')
    confidence = 'high'
  } else if (/cac|ltv|ticket/.test(normalized)) {
    title = 'Economia do cliente'
    answer = `O CAC estimado é ${currency(metrics.cac)}, o LTV estimado é ${currency(metrics.ltv)} e o ticket médio é ${currency(metrics.averageTicket)}.`
    evidence.push(`CAC: ${currency(metrics.cac)}`)
    evidence.push(`LTV: ${currency(metrics.ltv)}`)
    evidence.push(`Ticket médio: ${currency(metrics.averageTicket)}`)
    if (metrics.ltv > 0 && metrics.cac > 0) {
      evidence.push(`Relação LTV/CAC: ${(metrics.ltv / metrics.cac).toFixed(2)}`)
    }
    actions.push('Buscar uma relação LTV/CAC sustentável.')
    confidence = 'high'
  } else if (/prioridade|o que.*fazer|hoje|aten[cç][aã]o/.test(normalized)) {
    const brief = buildExecutiveBrief(metrics, insights)
    title = 'Prioridades executivas'
    answer = brief.priorities.length
      ? `As principais prioridades são: ${brief.priorities.join(' ')}`
      : 'Nenhuma prioridade crítica foi identificada.'
    evidence.push(...brief.risks)
    actions.push(...brief.priorities)
    confidence = 'high'
  }

  return { title, answer, evidence, actions, confidence }
}
