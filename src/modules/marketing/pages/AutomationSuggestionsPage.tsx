import { useMemo } from 'react'
import { BrainCircuit, CheckCircle2, Workflow } from 'lucide-react'
import { buildAutomationSuggestions } from '../../../lib/automationSuggestions'
import { useAiAgentsStore } from '../../../lib/aiAgentsStore'
import { useEventBusStore } from '../../../lib/eventBusStore'

export function AutomationSuggestionsPage() {
  const insights = useAiAgentsStore((state) => state.insights)
  const events = useEventBusStore((state) => state.events)
  const suggestions = useMemo(() => buildAutomationSuggestions({ insights, events }), [insights, events])

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">AUTOMAÇÕES INTELIGENTES</span><h1>Sugestões de workflow</h1><p>Fluxos recomendados a partir dos agentes e eventos da empresa.</p></div></header>
    <section className="automation-suggestions-grid">
      {suggestions.map((item) => <article key={item.id} className={`panel-card automation-suggestion priority-${item.priority}`}>
        <div className="automation-suggestion-head"><div className="automation-icon"><Workflow/></div><span>{item.source}</span></div>
        <h2>{item.title}</h2><p>{item.description}</p>
        <div className="automation-trigger"><BrainCircuit size={16}/><div><span>Gatilho</span><strong>{item.trigger}</strong></div></div>
        <div className="automation-actions-list">{item.actions.map((action) => <div key={action}><CheckCircle2 size={15}/><span>{action}</span></div>)}</div>
        <button type="button" disabled>Converter em fluxo — próxima etapa</button>
      </article>)}
      {!suggestions.length && <article className="panel-card empty-panel"><Workflow size={38}/><strong>Nenhuma sugestão agora</strong><span>Execute os agentes de IA e crie missões para gerar recomendações.</span></article>}
    </section>
  </div>
}
