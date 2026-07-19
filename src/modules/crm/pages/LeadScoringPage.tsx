import { useMemo } from 'react'
import { Flame, Gauge, Snowflake, Sparkles, Target, ThermometerSun } from 'lucide-react'
import { useCrmStore } from '../../../lib/crmStore'
import { calculateLeadScore } from '../../../lib/leadScoring'

export function LeadScoringPage() {
  const leads = useCrmStore((state) => state.leads)
  const ranked = useMemo(() => leads.filter((lead) => !['won','lost'].includes(lead.stage)).map((lead) => ({ lead, result: calculateLeadScore(lead) })).sort((a,b) => b.result.score - a.result.score), [leads])
  const groups = {
    very_hot: ranked.filter((item) => item.result.temperature === 'very_hot').length,
    hot: ranked.filter((item) => item.result.temperature === 'hot').length,
    warm: ranked.filter((item) => item.result.temperature === 'warm').length,
    cold: ranked.filter((item) => item.result.temperature === 'cold').length,
  }
  const average = ranked.length ? Math.round(ranked.reduce((sum,item)=>sum+item.result.score,0)/ranked.length) : 0

  return <div className="page lead-scoring-page">
    <header className="page-header"><div><span className="eyebrow">CRM • INTELIGÊNCIA COMERCIAL</span><h1>Pontuação de Leads e priorização</h1><p>Classifique automaticamente as oportunidades e concentre o time nos contatos com maior potencial.</p></div></header>
    <section className="crm-summary scoring-summary">
      <article className="panel-card compact-card"><Gauge/><span>Score médio</span><strong>{average}</strong></article>
      <article className="panel-card compact-card score-very-hot"><Sparkles/><span>Muito quentes</span><strong>{groups.very_hot}</strong></article>
      <article className="panel-card compact-card score-hot"><Flame/><span>Quentes</span><strong>{groups.hot}</strong></article>
      <article className="panel-card compact-card score-warm"><ThermometerSun/><span>Mornos</span><strong>{groups.warm}</strong></article>
      <article className="panel-card compact-card score-cold"><Snowflake/><span>Frios</span><strong>{groups.cold}</strong></article>
    </section>
    <section className="panel-card">
      <div className="section-title"><Target/><div><h2>Ranking de oportunidades</h2><p>A pontuação considera dados completos, consentimento, respostas, estágio, valor e prioridade.</p></div></div>
      <div className="scoring-list">{ranked.map(({lead,result}, index)=><article className={`scoring-row ${result.temperature}`} key={lead.id}>
        <div className="scoring-rank">#{index+1}</div>
        <div className="scoring-main"><div className="scoring-title"><strong>{lead.name}</strong><span>{lead.company || 'Sem empresa'}</span></div><small>{lead.owner || 'Sem responsável'} • {lead.city || 'Cidade não informada'} {lead.state ? `/ ${lead.state}` : ''}</small><p>{result.recommendedAction}</p><div className="scoring-reasons">{result.reasons.slice(0,5).map((reason)=><span key={reason}>{reason}</span>)}</div></div>
        <div className="scoring-score"><strong>{result.score}</strong><span>{result.label}</span></div>
      </article>)}</div>
      {!ranked.length && <p className="empty-state">Nenhuma oportunidade ativa para classificar.</p>}
    </section>
  </div>
}
