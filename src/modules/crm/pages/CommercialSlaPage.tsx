import { AlertTriangle, CheckCircle2, Clock3, Gauge, Settings2 } from 'lucide-react'
import { useMemo } from 'react'
import { useCrmStore } from '../../../lib/crmStore'
import type { LeadStage } from '../../../lib/crmTypes'
import { getLeadSla, useCommercialSlaStore } from '../../../lib/commercialSlaStore'

const stageLabels: Record<LeadStage, string> = { new: 'Novo lead', contacted: 'Contato', proposal: 'Proposta', negotiation: 'Negociação', won: 'Fechado', lost: 'Perdido' }
const editableStages: LeadStage[] = ['new', 'contacted', 'proposal', 'negotiation']

export function CommercialSlaPage() {
  const leads = useCrmStore((state) => state.leads)
  const { limits, warningPercent, setLimit, setWarningPercent } = useCommercialSlaStore()
  const active = useMemo(() => leads.filter((lead) => !['won', 'lost'].includes(lead.stage)).map((lead) => ({ lead, sla: getLeadSla(lead, limits, warningPercent) })), [leads, limits, warningPercent])
  const breached = active.filter((item) => item.sla.level === 'breached')
  const warning = active.filter((item) => item.sla.level === 'warning')
  const ok = active.filter((item) => item.sla.level === 'ok')

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CRM • GESTÃO DE SLA</span><h1>SLA comercial e alertas</h1><p>Controle o tempo máximo de atendimento e identifique oportunidades paradas em cada etapa.</p></div></header>
    <section className="sla-metrics">
      <article className="panel-card"><Gauge/><span>Oportunidades monitoradas</span><strong>{active.length}</strong></article>
      <article className="panel-card sla-ok"><CheckCircle2/><span>Dentro do prazo</span><strong>{ok.length}</strong></article>
      <article className="panel-card sla-warning"><Clock3/><span>Próximas do limite</span><strong>{warning.length}</strong></article>
      <article className="panel-card sla-breached"><AlertTriangle/><span>SLA estourado</span><strong>{breached.length}</strong></article>
    </section>
    <section className="panel-card sla-config"><div className="section-title"><Settings2/><div><h2>Limites por etapa</h2><p>Defina quantas horas um lead pode permanecer em cada fase antes de gerar alerta.</p></div></div><div className="sla-config-grid">{editableStages.map((stage)=><label key={stage}>{stageLabels[stage]}<input type="number" min="1" value={limits[stage]} onChange={(e)=>setLimit(stage, Number(e.target.value))}/><small>horas</small></label>)}<label>Alerta preventivo<input type="number" min="25" max="95" value={warningPercent} onChange={(e)=>setWarningPercent(Number(e.target.value))}/><small>% do prazo</small></label></div></section>
    <section className="sla-list">{active.sort((a,b)=>b.sla.percent-a.sla.percent).map(({lead,sla})=><article className={`panel-card sla-item ${sla.level}`} key={lead.id}><div><span className="sla-stage">{stageLabels[lead.stage]}</span><h3>{lead.name}</h3><p>{lead.company || 'Sem empresa'} • {lead.owner}</p></div><div className="sla-progress"><div><span style={{width:`${Math.min(100,sla.percent)}%`}}/></div><small>{Math.round(sla.elapsedHours)}h de {sla.limitHours}h • {sla.level==='breached' ? `atrasado ${Math.round(sla.elapsedHours-sla.limitHours)}h` : `${Math.round(sla.remainingHours)}h restantes`}</small></div><strong className={`sla-badge ${sla.level}`}>{sla.level==='breached'?'Estourado':sla.level==='warning'?'Atenção':'No prazo'}</strong></article>)}</section>
  </div>
}
