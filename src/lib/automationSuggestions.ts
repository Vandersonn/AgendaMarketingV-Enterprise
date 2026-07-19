import type { AgentInsight } from './aiAgentsStore'
import type { BusinessEvent } from './eventBusStore'

export interface AutomationSuggestion {
  id: string
  title: string
  description: string
  trigger: string
  actions: string[]
  priority: 'low' | 'medium' | 'high'
  source: string
}

export function buildAutomationSuggestions(input: {
  insights: AgentInsight[]
  events: BusinessEvent[]
}): AutomationSuggestion[] {
  const suggestions: AutomationSuggestion[] = []
  const activeInsights = input.insights.filter((item) => !item.dismissed)

  if (activeInsights.some((item) => item.agent === 'commercial' && item.severity === 'warning')) {
    suggestions.push({
      id: 'commercial-followup',
      title: 'Automatizar follow-up de leads parados',
      description: 'Crie uma tarefa e prepare uma mensagem sempre que um lead ficar sem atualização.',
      trigger: 'Lead sem atualização por 14 dias',
      actions: ['Criar tarefa de follow-up', 'Preparar mensagem de WhatsApp', 'Notificar responsável'],
      priority: 'high',
      source: 'Agente Comercial'
    })
  }

  if (activeInsights.some((item) => item.agent === 'financial' && item.severity === 'critical')) {
    suggestions.push({
      id: 'financial-collection',
      title: 'Fluxo de cobrança preventiva',
      description: 'Organize lembretes progressivos para receitas vencidas.',
      trigger: 'Lançamento financeiro vencido',
      actions: ['Criar alerta', 'Preparar cobrança', 'Criar tarefa para financeiro'],
      priority: 'high',
      source: 'Agente Financeiro'
    })
  }

  if (activeInsights.some((item) => item.agent === 'projects' && item.severity === 'critical')) {
    suggestions.push({
      id: 'project-risk',
      title: 'Escalonar projeto crítico',
      description: 'Avise o gestor e crie uma revisão quando o projeto entrar em risco.',
      trigger: 'Projeto com saúde crítica',
      actions: ['Notificar gestor', 'Criar reunião de revisão', 'Priorizar tarefas atrasadas'],
      priority: 'high',
      source: 'Agente de Projetos'
    })
  }

  if (activeInsights.some((item) => item.agent === 'marketing' && item.severity === 'opportunity')) {
    suggestions.push({
      id: 'marketing-calendar',
      title: 'Reforçar calendário editorial',
      description: 'Crie tarefas de conteúdo quando a programação estiver abaixo do mínimo.',
      trigger: 'Menos de três conteúdos agendados',
      actions: ['Criar pauta', 'Criar tarefas de produção', 'Solicitar aprovação'],
      priority: 'medium',
      source: 'Agente de Marketing'
    })
  }

  const recentMissionEvents = input.events.filter((item) => item.type === 'mission.created' && !item.processed)
  if (recentMissionEvents.length) {
    suggestions.push({
      id: 'mission-kickoff',
      title: 'Automatizar início de missão',
      description: `${recentMissionEvents.length} missão(ões) nova(s) podem gerar plano de execução automaticamente.`,
      trigger: 'Nova missão criada',
      actions: ['Criar tarefas iniciais', 'Notificar responsáveis', 'Agendar revisão semanal'],
      priority: 'medium',
      source: 'Barramento de Eventos'
    })
  }

  return suggestions
}
