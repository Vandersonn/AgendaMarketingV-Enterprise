import { useMemo, useState } from 'react'
import {
  Bot, BrainCircuit, CheckCircle2, Clock3, Play, Sparkles,
  Target, Trash2, TrendingUp, X
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { analyzeAgent } from '../../../lib/agentAnalysis'
import { useAiAgentsStore, type AgentType } from '../../../lib/aiAgentsStore'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { useMarketingStore } from '../../../lib/marketingStore'
import { useProjectsStore } from '../../../lib/projectsStore'
import { useSupportStore } from '../../../lib/supportStore'
import { useTasksStore } from '../../../lib/tasksStore'

const agentIcons: Record<AgentType, typeof Bot> = {
  commercial: Target,
  financial: TrendingUp,
  marketing: Sparkles,
  projects: BrainCircuit,
  support: Bot
}

export function AiAgentsPage() {
  const { agents, insights, memories, toggleAgent, updateInterval, saveAnalysis, dismissInsight, clearDismissed } = useAiAgentsStore()
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const finance = useFinanceStore((state) => state.entries)
  const contents = useMarketingStore((state) => state.contents)
  const projects = useProjectsStore((state) => state.projects)
  const tasks = useTasksStore((state) => state.tasks)
  const tickets = useSupportStore((state) => state.tickets)
  const contracts = useContractsStore((state) => state.contracts)
  const events = useCalendarStore((state) => state.events)
  const [message, setMessage] = useState('')

  const activeInsights = useMemo(() => insights.filter((item) => !item.dismissed), [insights])
  const critical = activeInsights.filter((item) => item.severity === 'critical').length
  const opportunities = activeInsights.filter((item) => item.severity === 'opportunity').length

  const data = { clients, leads, finance, contents, projects, tasks, tickets, contracts, events }

  function run(agent: AgentType) {
    const result = analyzeAgent(agent, data)
    saveAnalysis(agent, result.insights, result.metrics)
    setMessage(`${result.insights.length} análise(s) gerada(s).`)
  }

  function runAll() {
    for (const agent of agents.filter((item) => item.enabled)) {
      const result = analyzeAgent(agent.id, data)
      saveAnalysis(agent.id, result.insights, result.metrics)
    }
    setMessage('Todos os agentes ativos foram executados.')
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">INTELIGÊNCIA OPERACIONAL</span>
          <h1>Central de Agentes de IA</h1>
          <p>Análises automáticas baseadas nos dados reais do sistema.</p>
        </div>
        <Button onClick={runAll}><Play size={18} /> Executar todos</Button>
      </header>

      {message && <div className="form-message success">{message}</div>}

      <section className="crm-summary">
        <article className="panel-card compact-card"><span>Agentes ativos</span><strong>{agents.filter((item) => item.enabled).length}</strong></article>
        <article className="panel-card compact-card"><span>Insights ativos</span><strong>{activeInsights.length}</strong></article>
        <article className="panel-card compact-card"><span>Alertas críticos</span><strong>{critical}</strong></article>
        <article className="panel-card compact-card"><span>Oportunidades</span><strong>{opportunities}</strong></article>
      </section>

      <section className="agents-grid">
        {agents.map((agent) => {
          const Icon = agentIcons[agent.id]
          const agentInsightCount = activeInsights.filter((item) => item.agent === agent.id).length
          return (
            <article key={agent.id} className={`panel-card agent-card ${agent.enabled ? 'enabled' : 'disabled'}`}>
              <div className="agent-card-head">
                <div className="agent-icon"><Icon /></div>
                <button type="button" className={`agent-switch ${agent.enabled ? 'active' : ''}`} onClick={() => toggleAgent(agent.id)}>
                  {agent.enabled ? 'Ativo' : 'Inativo'}
                </button>
              </div>
              <h2>{agent.name}</h2>
              <p>{agent.description}</p>
              <div className="agent-stats">
                <span><BrainCircuit size={14} /> {agentInsightCount} insight(s)</span>
                <span><Clock3 size={14} /> {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString('pt-BR') : 'Nunca executado'}</span>
              </div>
              <label>Executar a cada
                <div className="agent-interval">
                  <input type="number" min="1" max="168" value={agent.intervalHours} onChange={(event) => updateInterval(agent.id, Number(event.target.value))} />
                  <span>hora(s)</span>
                </div>
              </label>
              <Button variant="secondary" onClick={() => run(agent.id)} disabled={!agent.enabled}><Play size={16} /> Executar análise</Button>
            </article>
          )
        })}
      </section>

      <section className="ai-operations-grid">
        <article className="panel-card insights-panel">
          <div className="panel-header">
            <div><h2>Insights proativos</h2><p>Prioridades identificadas pelos agentes.</p></div>
            <Button variant="secondary" onClick={clearDismissed} disabled={!insights.some((item) => item.dismissed)}>
              <Trash2 size={16} /> Limpar descartados
            </Button>
          </div>
          <div className="agent-insights-list">
            {activeInsights.map((item) => (
              <div key={item.id} className={`agent-insight severity-${item.severity}`}>
                <div className="insight-symbol">
                  {item.severity === 'critical' ? <X /> : <CheckCircle2 />}
                </div>
                <div>
                  <span>{agents.find((agent) => agent.id === item.agent)?.name}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <a href={`#${item.path}`}>Abrir módulo relacionado</a>
                </div>
                <button type="button" onClick={() => dismissInsight(item.id)}>Descartar</button>
              </div>
            ))}
            {!activeInsights.length && <div className="empty-inline">Execute os agentes para gerar análises.</div>}
          </div>
        </article>

        <article className="panel-card memory-panel">
          <div className="panel-header"><div><h2>Memória organizacional</h2><p>Histórico numérico das análises.</p></div></div>
          <div className="memory-list">
            {memories.slice(0, 20).map((memory) => (
              <div key={memory.id}>
                <strong>{memory.label}</strong>
                <span>{Object.entries(memory.metrics).map(([key, value]) => `${key}: ${Number(value).toFixed(1)}`).join(' • ')}</span>
              </div>
            ))}
            {!memories.length && <div className="empty-inline">Nenhuma memória registrada.</div>}
          </div>
        </article>
      </section>
    </div>
  )
}
