import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type AgentType = 'commercial' | 'financial' | 'marketing' | 'projects' | 'support'
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'opportunity'

export interface AgentConfig {
  id: AgentType
  name: string
  description: string
  enabled: boolean
  intervalHours: number
  lastRunAt: string
  nextRunAt: string
}

export interface AgentInsight {
  id: string
  agent: AgentType
  title: string
  description: string
  severity: InsightSeverity
  path: string
  fingerprint: string
  dismissed: boolean
  createdAt: string
}

export interface MemorySnapshot {
  id: string
  label: string
  metrics: Record<string, number>
  createdAt: string
}

interface AiAgentsState {
  agents: AgentConfig[]
  insights: AgentInsight[]
  memories: MemorySnapshot[]
  toggleAgent: (id: AgentType) => void
  updateInterval: (id: AgentType, intervalHours: number) => void
  saveAnalysis: (agent: AgentType, generated: Omit<AgentInsight, 'id' | 'createdAt' | 'dismissed'>[], metrics: Record<string, number>) => void
  dismissInsight: (id: string) => void
  clearDismissed: () => void
  runDueAgents: (runner: (agent: AgentType) => { insights: Omit<AgentInsight, 'id' | 'createdAt' | 'dismissed'>[]; metrics: Record<string, number> }) => void
}

const defaults: AgentConfig[] = [
  { id: 'commercial', name: 'Agente Comercial', description: 'Analisa leads, pipeline e oportunidades.', enabled: true, intervalHours: 12, lastRunAt: '', nextRunAt: '' },
  { id: 'financial', name: 'Agente Financeiro', description: 'Monitora receitas, cobranças e fluxo de caixa.', enabled: true, intervalHours: 12, lastRunAt: '', nextRunAt: '' },
  { id: 'marketing', name: 'Agente de Marketing', description: 'Analisa conteúdo, calendário e aprovações.', enabled: true, intervalHours: 24, lastRunAt: '', nextRunAt: '' },
  { id: 'projects', name: 'Agente de Projetos', description: 'Identifica atrasos, riscos e sobrecarga.', enabled: true, intervalHours: 12, lastRunAt: '', nextRunAt: '' },
  { id: 'support', name: 'Agente de Atendimento', description: 'Acompanha SLA, chamados e satisfação.', enabled: true, intervalHours: 6, lastRunAt: '', nextRunAt: '' }
]

const saved = loadLocal<{
  agents?: AgentConfig[]
  insights?: AgentInsight[]
  memories?: MemorySnapshot[]
}>('ai_agents', {})

const savedAgents = Array.isArray(saved.agents) ? saved.agents : []
const savedInsights = Array.isArray(saved.insights) ? saved.insights : []
const savedMemories = Array.isArray(saved.memories) ? saved.memories : []

function persist(agents: AgentConfig[], insights: AgentInsight[], memories: MemorySnapshot[]) {
  saveLocal('ai_agents', { agents, insights, memories })
}

function nextRun(intervalHours: number): string {
  return new Date(Date.now() + Math.max(1, intervalHours) * 3600000).toISOString()
}

export const useAiAgentsStore = create<AiAgentsState>((set, get) => ({
  agents: defaults.map((item) => {
    const savedAgent = savedAgents.find((candidate) => candidate?.id === item.id)
    return savedAgent
      ? {
          ...item,
          ...savedAgent,
          intervalHours: Math.max(1, Number(savedAgent.intervalHours || item.intervalHours))
        }
      : item
  }),
  insights: savedInsights.filter((item) => item && typeof item.id === 'string'),
  memories: savedMemories.filter((item) => item && typeof item.id === 'string'),

  toggleAgent: (id) => set((state) => {
    const agents = state.agents.map((agent) =>
      agent.id === id ? { ...agent, enabled: !agent.enabled } : agent
    )
    persist(agents, state.insights, state.memories)
    return { agents }
  }),

  updateInterval: (id, intervalHours) => set((state) => {
    const agents = state.agents.map((agent) =>
      agent.id === id
        ? { ...agent, intervalHours: Math.max(1, intervalHours), nextRunAt: nextRun(intervalHours) }
        : agent
    )
    persist(agents, state.insights, state.memories)
    return { agents }
  }),

  saveAnalysis: (agentId, generated, metrics) => set((state) => {
    const now = new Date().toISOString()
    const agent = state.agents.find((item) => item.id === agentId)
    const existingFingerprints = new Set(
      state.insights.filter((item) => !item.dismissed).map((item) => item.fingerprint)
    )

    const newInsights: AgentInsight[] = generated
      .filter((item) => !existingFingerprints.has(item.fingerprint))
      .map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        dismissed: false,
        createdAt: now
      }))

    const agents = state.agents.map((item) =>
      item.id === agentId
        ? { ...item, lastRunAt: now, nextRunAt: nextRun(item.intervalHours) }
        : item
    )

    const memories: MemorySnapshot[] = [{
      id: crypto.randomUUID(),
      label: `${agent?.name ?? agentId} — ${new Date(now).toLocaleString('pt-BR')}`,
      metrics,
      createdAt: now
    }, ...state.memories].slice(0, 120)

    const insights = [...newInsights, ...state.insights].slice(0, 500)
    persist(agents, insights, memories)

    logSystem('info', 'Agentes de IA', `${agent?.name ?? agentId} executado`, `${newInsights.length} novo(s) insight(s)`)
    return { agents, insights, memories }
  }),

  dismissInsight: (id) => set((state) => {
    const insights = state.insights.map((item) => item.id === id ? { ...item, dismissed: true } : item)
    persist(state.agents, insights, state.memories)
    return { insights }
  }),

  clearDismissed: () => set((state) => {
    const insights = state.insights.filter((item) => !item.dismissed)
    persist(state.agents, insights, state.memories)
    return { insights }
  }),

  runDueAgents: (runner) => {
    const state = get()
    for (const agent of state.agents) {
      if (!agent.enabled) continue
      const due = !agent.nextRunAt || new Date(agent.nextRunAt).getTime() <= Date.now()
      if (!due) continue
      const result = runner(agent.id)
      get().saveAnalysis(agent.id, result.insights, result.metrics)
    }
  }
}))
