import { useMemo } from 'react'
import { AlertTriangle, HeartPulse, ShieldCheck, TrendingDown } from 'lucide-react'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { useMarketingStore } from '../../../lib/marketingStore'

type HealthLevel = 'healthy' | 'attention' | 'risk'

export function ClientHealthPage() {
  const clients = useCrmStore((state)=>state.clients)
  const leads = useCrmStore((state)=>state.leads)
  const contracts = useContractsStore((state)=>state.contracts)
  const finance = useFinanceStore((state)=>state.entries)
  const events = useCalendarStore((state)=>state.events)
  const contents = useMarketingStore((state)=>state.contents)

  const rows = useMemo(()=>clients.map((client)=>{
    const clientContracts = contracts.filter((item)=>item.clientId===client.id)
    const activeContract = clientContracts.some((item)=>item.status==='active')
    const overdue = finance.filter((item)=>item.clientId===client.id && item.status==='overdue').length
    const futureEvents = events.filter((item)=>item.clientId===client.id && new Date(item.start)>=new Date()).length
    const recentContents = contents.filter((item)=>item.clientId===client.id && new Date(item.createdAt).getTime()>=Date.now()-30*86400000).length
    const openLeads = leads.filter((item)=>item.clientId===client.id && !['won','lost'].includes(item.stage)).length
    let score = 50
    if(activeContract) score += 25
    if(futureEvents>0) score += 10
    if(recentContents>0) score += 10
    if(openLeads>0) score += 5
    score -= overdue*25
    score = Math.max(0,Math.min(100,score))
    const level:HealthLevel = score>=75?'healthy':score>=45?'attention':'risk'
    return {client,score,level,activeContract,overdue,futureEvents,recentContents}
  }),[clients,contracts,finance,events,contents,leads])

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CUSTOMER SUCCESS</span><h1>Saúde dos clientes</h1><p>Identifique risco, oportunidades de renovação e necessidade de contato.</p></div></header>
    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Saudáveis</span><strong>{rows.filter((item)=>item.level==='healthy').length}</strong></article>
      <article className="panel-card compact-card"><span>Precisam de atenção</span><strong>{rows.filter((item)=>item.level==='attention').length}</strong></article>
      <article className="panel-card compact-card"><span>Em risco</span><strong>{rows.filter((item)=>item.level==='risk').length}</strong></article>
    </section>
    <section className="health-grid">
      {rows.sort((a,b)=>a.score-b.score).map((row)=>{
        const Icon=row.level==='healthy'?ShieldCheck:row.level==='attention'?AlertTriangle:TrendingDown
        return <article key={row.client.id} className={`panel-card health-card level-${row.level}`}>
          <div className="health-card-header"><div className="health-icon"><Icon/></div><div><h2>{row.client.name}</h2><p>{row.client.company}</p></div><strong>{row.score}</strong></div>
          <div className="health-score-track"><div style={{width:`${row.score}%`}}/></div>
          <div className="health-indicators">
            <span className={row.activeContract?'ok':'bad'}>Contrato ativo: {row.activeContract?'Sim':'Não'}</span>
            <span className={row.overdue?'bad':'ok'}>Cobranças vencidas: {row.overdue}</span>
            <span>Próximos eventos: {row.futureEvents}</span>
            <span>Conteúdos em 30 dias: {row.recentContents}</span>
          </div>
          <div className="health-recommendation"><HeartPulse size={16}/><p>{row.level==='healthy'?'Cliente estável. Trabalhe expansão e indicação.':row.level==='attention'?'Agende contato e revise entregas e contrato.':'Prioridade alta: trate inadimplência, ausência de contrato ou baixa atividade.'}</p></div>
        </article>
      })}
      {!rows.length&&<article className="panel-card empty-panel"><strong>Nenhum cliente cadastrado</strong></article>}
    </section>
  </div>
}
