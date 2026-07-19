import { useMemo, useState } from 'react'
import { AlertTriangle, BrainCircuit, Search, Sparkles, Target, TrendingUp } from 'lucide-react'
import { analyzeLeads } from '../../../lib/crmIntelligence'
import { useCrmStore } from '../../../lib/crmStore'

export function CrmIntelligencePage() {
  const leads = useCrmStore((state) => state.leads)
  const [query, setQuery] = useState('')
  const analyzed = useMemo(() => analyzeLeads(leads), [leads])
  const filtered = analyzed.filter((item) =>
    `${item.lead.name} ${item.lead.company} ${item.lead.source}`.toLowerCase().includes(query.toLowerCase())
  )
  const expected = analyzed.reduce((sum, item) => sum + item.expectedValue, 0)
  const highRisk = analyzed.filter((item) => item.risk === 'high' && !['won','lost'].includes(item.lead.stage)).length
  const highProbability = analyzed.filter((item) => item.probability >= 70 && !['won','lost'].includes(item.lead.stage)).length

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CRM INTELIGENTE</span><h1>Score e previsão comercial</h1><p>Priorize oportunidades com base em estágio, dados, valor e recência.</p></div></header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Valor esperado</span><strong>{expected.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></article>
      <article className="panel-card compact-card"><span>Alta probabilidade</span><strong>{highProbability}</strong></article>
      <article className="panel-card compact-card"><span>Alto risco</span><strong>{highRisk}</strong></article>
    </section>

    <div className="search-box"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead, empresa ou origem..."/></div>

    <section className="crm-intelligence-grid">
      {filtered.map((item) => <article key={item.lead.id} className={`panel-card intelligent-lead risk-${item.risk}`}>
        <div className="intelligent-lead-head">
          <div><span>{item.lead.stage}</span><h2>{item.lead.name}</h2><p>{item.lead.company || item.lead.source}</p></div>
          <div className="lead-score"><BrainCircuit size={18}/><strong>{item.score}</strong></div>
        </div>
        <div className="probability-line"><div><span>Probabilidade</span><strong>{item.probability}%</strong></div><div className="project-progress-track"><div style={{width:`${item.probability}%`}}/></div></div>
        <div className="intelligence-values"><div><span>Negócio</span><strong>{item.lead.value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div><div><span>Valor esperado</span><strong>{item.expectedValue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div></div>
        <div className="intelligence-recommendation"><Sparkles size={16}/><p>{item.recommendation}</p></div>
        <div className="intelligence-footer"><span><Target size={14}/> Próxima ação: {item.lead.nextAction || 'Não definida'}</span>{item.risk === 'high' && <span className="risk-alert"><AlertTriangle size={14}/> Alto risco</span>}</div>
      </article>)}
      {!filtered.length && <article className="panel-card empty-panel"><TrendingUp size={34}/><strong>Nenhuma oportunidade encontrada</strong></article>}
    </section>
  </div>
}
