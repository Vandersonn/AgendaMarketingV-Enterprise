import { useMemo, useState } from 'react'
import {
  AlertTriangle, BrainCircuit, CheckCircle2, Download, Lightbulb,
  ListChecks, Play, Sparkles, Target, Trash2
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAiAgentsStore } from '../../../lib/aiAgentsStore'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { buildExecutiveBrief, answerExecutiveQuestion, type ExecutiveAnswer } from '../../../lib/executiveAiEngine'
import { useExecutiveActionStore } from '../../../lib/executiveActionStore'
import { calculateExecutiveMetrics } from '../../../lib/executiveAnalytics'
import { useFinanceStore } from '../../../lib/financeStore'
import { useProjectsStore } from '../../../lib/projectsStore'
import { useSupportStore } from '../../../lib/supportStore'
import { useTasksStore } from '../../../lib/tasksStore'

const suggestedQuestions = [
  'Quanto vou faturar nos próximos 30 dias?',
  'Quais clientes estão em risco?',
  'Quais contratos precisam de atenção?',
  'Como está o lucro da empresa?',
  'Quais projetos e tarefas estão atrasados?',
  'Quais são as prioridades de hoje?',
  'Qual é o CAC, LTV e ticket médio?',
  'Como está o atendimento e o SLA?'
]

export function AiExecutivePage() {
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const finance = useFinanceStore((state) => state.entries)
  const contracts = useContractsStore((state) => state.contracts)
  const projects = useProjectsStore((state) => state.projects)
  const tasks = useTasksStore((state) => state.tasks)
  const tickets = useSupportStore((state) => state.tickets)
  useCalendarStore((state) => state.events)
  const insights = useAiAgentsStore((state) => state.insights)
  const { actions, addActions, updateStatus, remove } = useExecutiveActionStore()

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<ExecutiveAnswer | null>(null)

  const metrics = useMemo(() => calculateExecutiveMetrics({
    clients, leads, finance, contracts, projects, tasks, tickets
  }), [clients, leads, finance, contracts, projects, tasks, tickets])

  const brief = useMemo(() => buildExecutiveBrief(metrics, insights), [metrics, insights])

  function ask(value = question) {
    const normalized = value.trim()
    if (!normalized) return
    setQuestion(normalized)
    setAnswer(answerExecutiveQuestion(normalized, metrics, insights))
  }

  function exportBrief() {
    const report = {
      generatedAt: new Date().toISOString(),
      healthScore: brief.healthScore,
      headline: brief.headline,
      summary: brief.summary,
      priorities: brief.priorities,
      opportunities: brief.opportunities,
      risks: brief.risks,
      metrics,
      actions
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'AgendaMarketingV-relatorio-executivo.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">AI EXECUTIVE</span>
        <h1>Diretor Executivo Virtual</h1>
        <p>Análises estratégicas baseadas nos dados cadastrados no sistema.</p>
      </div>
      <Button variant="secondary" onClick={exportBrief}><Download size={17}/> Exportar relatório</Button>
    </header>

    <section className="ai-executive-hero panel-card">
      <div className={`executive-health-score ${brief.healthScore < 65 ? 'critical' : brief.healthScore < 85 ? 'warning' : ''}`}>
        <BrainCircuit />
        <strong>{brief.healthScore}</strong>
        <span>/100</span>
      </div>
      <div>
        <span className="eyebrow">SAÚDE EMPRESARIAL</span>
        <h2>{brief.headline}</h2>
        <p>{brief.summary}</p>
      </div>
    </section>

    <section className="executive-brief-grid">
      <article className="panel-card">
        <div className="panel-header"><div><h2>Prioridades</h2><p>Ações recomendadas para os próximos dias.</p></div><Target/></div>
        <div className="executive-brief-list">
          {brief.priorities.map((item) => <div key={item}><ListChecks size={16}/><span>{item}</span></div>)}
          {!brief.priorities.length && <div className="empty-inline">Nenhuma prioridade crítica.</div>}
        </div>
        <Button className="full" variant="secondary" onClick={() => addActions(brief.priorities, 'Resumo Executivo')} disabled={!brief.priorities.length}>
          <Play size={16}/> Criar plano de ação
        </Button>
      </article>

      <article className="panel-card">
        <div className="panel-header"><div><h2>Oportunidades</h2><p>Possibilidades identificadas nos dados.</p></div><Lightbulb/></div>
        <div className="executive-brief-list opportunities">
          {brief.opportunities.map((item) => <div key={item}><Sparkles size={16}/><span>{item}</span></div>)}
          {!brief.opportunities.length && <div className="empty-inline">Nenhuma oportunidade detectada.</div>}
        </div>
      </article>

      <article className="panel-card">
        <div className="panel-header"><div><h2>Riscos</h2><p>Pontos que exigem monitoramento.</p></div><AlertTriangle/></div>
        <div className="executive-brief-list risks">
          {brief.risks.map((item) => <div key={item}><AlertTriangle size={16}/><span>{item}</span></div>)}
          {!brief.risks.length && <div className="empty-inline">Nenhum risco relevante.</div>}
        </div>
      </article>
    </section>

    <section className="ai-question-panel panel-card">
      <div className="panel-header"><div><h2>Pergunte ao diretor virtual</h2><p>Receba respostas com evidências e ações sugeridas.</p></div><BrainCircuit/></div>
      <div className="ai-question-form">
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex.: Quais clientes estão em risco?"/>
        <Button onClick={() => ask()}><Sparkles size={17}/> Analisar</Button>
      </div>
      <div className="suggested-question-list">
        {suggestedQuestions.map((item) => <button type="button" key={item} onClick={() => ask(item)}>{item}</button>)}
      </div>

      {answer && <article className="executive-answer">
        <span>Confiança: {answer.confidence}</span>
        <h3>{answer.title}</h3>
        <p>{answer.answer}</p>

        <div className="answer-evidence-grid">
          <div>
            <strong>Evidências</strong>
            {answer.evidence.map((item) => <div key={item}><CheckCircle2 size={14}/><span>{item}</span></div>)}
            {!answer.evidence.length && <small>Nenhuma evidência adicional.</small>}
          </div>
          <div>
            <strong>Ações sugeridas</strong>
            {answer.actions.map((item) => <div key={item}><Target size={14}/><span>{item}</span></div>)}
            {!answer.actions.length && <small>Nenhuma ação adicional.</small>}
          </div>
        </div>

        <Button variant="secondary" onClick={() => addActions(answer.actions, answer.title)} disabled={!answer.actions.length}>
          <ListChecks size={16}/> Adicionar ao plano
        </Button>
      </article>}
    </section>

    <article className="panel-card executive-action-panel">
      <div className="panel-header"><div><h2>Plano de ação executivo</h2><p>{actions.length} ação(ões) registrada(s).</p></div></div>
      <div className="executive-action-list">
        {actions.map((item) => <div key={item.id} className={`status-${item.status}`}>
          <div>
            <span>{item.source} • prioridade {item.priority}</span>
            <strong>{item.title}</strong>
            <small>Prazo: {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</small>
          </div>
          <select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as typeof item.status)}>
            <option value="planned">Planejada</option>
            <option value="doing">Em execução</option>
            <option value="done">Concluída</option>
          </select>
          <button type="button" onClick={() => remove(item.id)}><Trash2 size={16}/></button>
        </div>)}
        {!actions.length && <div className="empty-inline">Nenhuma ação executiva criada.</div>}
      </div>
    </article>
  </div>
}
