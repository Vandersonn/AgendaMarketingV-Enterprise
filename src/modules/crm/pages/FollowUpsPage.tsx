import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, MessageCircle, PhoneCall } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCrmStore } from '../../../lib/crmStore'
import type { Lead } from '../../../lib/crmTypes'

function bucket(lead: Lead) {
  if (!lead.nextActionAt) return 'unscheduled'
  const due = new Date(lead.nextActionAt).getTime()
  const now = Date.now()
  const endToday = new Date(); endToday.setHours(23,59,59,999)
  if (due < now) return 'overdue'
  if (due <= endToday.getTime()) return 'today'
  return 'upcoming'
}

export function FollowUpsPage() {
  const { leads, updateLead, addActivity } = useCrmStore()
  const [filter, setFilter] = useState<'all'|'overdue'|'today'|'upcoming'|'unscheduled'>('all')
  const open = useMemo(() => leads.filter(l => !['won','lost'].includes(l.stage) && l.nextAction), [leads])
  const filtered = open.filter(l => filter === 'all' || bucket(l) === filter).sort((a,b) => (a.nextActionAt || '9999').localeCompare(b.nextActionAt || '9999'))
  const counts = { overdue: open.filter(l=>bucket(l)==='overdue').length, today: open.filter(l=>bucket(l)==='today').length, upcoming: open.filter(l=>bucket(l)==='upcoming').length, unscheduled: open.filter(l=>bucket(l)==='unscheduled').length }
  const done = (lead: Lead) => {
    const now = new Date().toISOString()
    addActivity({leadId:lead.id,type:'task',title:'Acompanhamento concluído',description:lead.nextAction,date:now})
    updateLead({...lead,nextAction:'',nextActionAt:'',followUpPriority:'normal'})
  }
  const postpone = (lead: Lead, days: number) => updateLead({...lead,nextActionAt:new Date(Date.now()+days*86400000).toISOString()})
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CRM • PRODUTIVIDADE</span><h1>Central de acompanhamento</h1><p>Priorize retornos vencidos, contatos de hoje e próximas ações do Kanban.</p></div></header>
    <section className="followup-metrics">
      <button type="button" onClick={()=>setFilter('overdue')}><AlertTriangle/><span>Vencidos</span><strong>{counts.overdue}</strong></button>
      <button type="button" onClick={()=>setFilter('today')}><Clock3/><span>Para hoje</span><strong>{counts.today}</strong></button>
      <button type="button" onClick={()=>setFilter('upcoming')}><CalendarClock/><span>Próximos</span><strong>{counts.upcoming}</strong></button>
      <button type="button" onClick={()=>setFilter('unscheduled')}><MessageCircle/><span>Sem data</span><strong>{counts.unscheduled}</strong></button>
    </section>
    <div className="followup-filter"><button type="button" className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Todos ({open.length})</button><button type="button" onClick={()=>setFilter('overdue')}>Vencidos</button><button type="button" onClick={()=>setFilter('today')}>Hoje</button><button type="button" onClick={()=>setFilter('upcoming')}>Próximos</button><button type="button" onClick={()=>setFilter('unscheduled')}>Sem data</button></div>
    <section className="followup-list">{filtered.length===0 ? <div className="panel-card empty-campaign"><CheckCircle2 size={38}/><h2>Nenhum follow-up nesta categoria</h2></div> : filtered.map(lead => <article className={`panel-card followup-item ${bucket(lead)} priority-${lead.followUpPriority||'normal'}`} key={lead.id}>
      <div><span>{lead.company || lead.city || 'Lead'}</span><h3>{lead.name}</h3><p>{lead.nextAction}</p><small>{lead.nextActionAt ? new Date(lead.nextActionAt).toLocaleString('pt-BR') : 'Data ainda não definida'} • {lead.owner}</small></div>
      <div className="followup-actions"><Button className="secondary" onClick={()=>postpone(lead,1)}><CalendarClock size={16}/> Amanhã</Button><Button className="secondary" onClick={()=>postpone(lead,3)}><Clock3 size={16}/> +3 dias</Button><Button onClick={()=>done(lead)}><CheckCircle2 size={16}/> Concluir</Button>{lead.phone && <a className="followup-phone" href={`tel:${lead.phone.replace(/\D/g,'')}`}><PhoneCall size={16}/></a>}</div>
    </article>)}</section>
  </div>
}
