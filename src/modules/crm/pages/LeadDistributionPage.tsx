import { ArrowRightLeft, BadgeCheck, BriefcaseBusiness, Settings2, UserPlus, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCrmStore } from '../../../lib/crmStore'
import { useTeamStore } from '../../../lib/teamStore'
import { useLeadDistributionStore } from '../../../lib/leadDistributionStore'

const activeStages = new Set(['new','contacted','proposal','negotiation'])

export function LeadDistributionPage() {
  const leads = useCrmStore((state)=>state.leads)
  const updateLead = useCrmStore((state)=>state.updateLead)
  const addActivity = useCrmStore((state)=>state.addActivity)
  const members = useTeamStore((state)=>state.members)
  const {mode,maxActivePerOwner,autoAssignImports,setMode,setMaxActivePerOwner,setAutoAssignImports}=useLeadDistributionStore()
  const [message,setMessage]=useState('')
  const sellers=useMemo(()=>members.filter((member)=>member.active && ['owner','admin','sales'].includes(member.role)),[members])
  const active=useMemo(()=>leads.filter((lead)=>activeStages.has(lead.stage)),[leads])
  const counts=useMemo(()=>Object.fromEntries(sellers.map((seller)=>[seller.name,active.filter((lead)=>lead.owner===seller.name).length])),[sellers,active])
  const unassigned=active.filter((lead)=>!lead.owner || !sellers.some((seller)=>seller.name===lead.owner))

  const distribute=(all:boolean)=>{
    if(!sellers.length){setMessage('Cadastre ao menos um vendedor ativo na página Equipe.');return}
    const targets=all?active:unassigned
    if(!targets.length){setMessage(all?'Não há oportunidades ativas para redistribuir.':'Todos os leads ativos já possuem responsável.');return}
    const working=Object.fromEntries(sellers.map((seller)=>[seller.name,all?0:(counts[seller.name]||0)])) as Record<string,number>
    let round=0, assigned=0, limited=0
    targets.forEach((lead)=>{
      const available=sellers.filter((seller)=>working[seller.name]<maxActivePerOwner)
      if(!available.length){limited++;return}
      const seller=mode==='balanced'
        ? [...available].sort((a,b)=>working[a.name]-working[b.name] || a.name.localeCompare(b.name))[0]
        : available[round++ % available.length]
      updateLead({...lead,owner:seller.name})
      addActivity({leadId:lead.id,type:'task',title:'Responsável definido',description:`Lead distribuído para ${seller.name} pela Central de Distribuição.`,date:new Date().toISOString()})
      working[seller.name]++; assigned++
    })
    setMessage(`${assigned} lead(s) distribuído(s)${limited?`; ${limited} aguardando capacidade`:''}.`)
  }

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CRM • GESTÃO DE CARTEIRA</span><h1>Distribuição de leads</h1><p>Equilibre oportunidades entre vendedores e reduza atrasos no primeiro atendimento.</p></div></header>
    <section className="distribution-metrics">
      <article className="panel-card"><BriefcaseBusiness/><span>Leads ativos</span><strong>{active.length}</strong></article>
      <article className="panel-card"><UserPlus/><span>Sem responsável</span><strong>{unassigned.length}</strong></article>
      <article className="panel-card"><UsersRound/><span>Vendedores ativos</span><strong>{sellers.length}</strong></article>
      <article className="panel-card"><BadgeCheck/><span>Capacidade total</span><strong>{sellers.length*maxActivePerOwner}</strong></article>
    </section>
    <section className="panel-card distribution-config"><div className="section-title"><Settings2/><div><h2>Regras de distribuição</h2><p>Escolha como o CRM define o responsável por cada oportunidade.</p></div></div><div className="distribution-config-grid"><label>Estratégia<select value={mode} onChange={(e)=>setMode(e.target.value as 'balanced'|'round_robin')}><option value="balanced">Menor carteira primeiro</option><option value="round_robin">Rodízio sequencial</option></select></label><label>Máximo de leads ativos por vendedor<input type="number" min="1" value={maxActivePerOwner} onChange={(e)=>setMaxActivePerOwner(Number(e.target.value))}/></label><label className="distribution-check"><input type="checkbox" checked={autoAssignImports} onChange={(e)=>setAutoAssignImports(e.target.checked)}/> Preparar distribuição automática nas importações</label></div><div className="distribution-actions"><button type="button" className="primary-button" onClick={()=>distribute(false)}><UserPlus size={18}/> Distribuir sem responsável</button><button type="button" className="secondary-button" onClick={()=>distribute(true)}><ArrowRightLeft size={18}/> Reequilibrar carteira ativa</button></div>{message&&<p className="distribution-message">{message}</p>}</section>
    <section className="distribution-team">{sellers.map((seller)=>{const total=counts[seller.name]||0; const percent=Math.min(100,(total/maxActivePerOwner)*100); return <article className="panel-card distribution-owner" key={seller.id}><div><span className="owner-role">{seller.role}</span><h3>{seller.name}</h3><p>{seller.email}</p></div><strong>{total}<small> / {maxActivePerOwner}</small></strong><div className="owner-capacity"><span style={{width:`${percent}%`}}/></div><small>{Math.max(0,maxActivePerOwner-total)} vagas disponíveis</small></article>})}</section>
  </div>
}
