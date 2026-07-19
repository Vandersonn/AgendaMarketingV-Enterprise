import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { buildGlobalSearchIndex, searchGlobal, type GlobalSearchResult } from '../../../lib/globalSearch'
import { useMarketingStore } from '../../../lib/marketingStore'
import { useProjectsStore } from '../../../lib/projectsStore'
import { useSupportStore } from '../../../lib/supportStore'
import { useTasksStore } from '../../../lib/tasksStore'

const typeLabels: Record<GlobalSearchResult['type'], string> = {
  client: 'Cliente', lead: 'Lead', task: 'Tarefa', project: 'Projeto', contract: 'Contrato',
  finance: 'Financeiro', calendar: 'Agenda', support: 'Suporte', marketing: 'Marketing'
}

export function GlobalSearchPage(){
  const navigate=useNavigate()
  const [params,setParams]=useSearchParams()
  const [query,setQuery]=useState(params.get('q') || '')
  const [type,setType]=useState<'all' | GlobalSearchResult['type']>('all')
  const clients=useCrmStore((state)=>state.clients)
  const leads=useCrmStore((state)=>state.leads)
  const tasks=useTasksStore((state)=>state.tasks)
  const projects=useProjectsStore((state)=>state.projects)
  const contracts=useContractsStore((state)=>state.contracts)
  const finance=useFinanceStore((state)=>state.entries)
  const events=useCalendarStore((state)=>state.events)
  const tickets=useSupportStore((state)=>state.tickets)
  const contents=useMarketingStore((state)=>state.contents)

  const index=useMemo(()=>buildGlobalSearchIndex({clients,leads,tasks,projects,contracts,finance,events,tickets,contents}),[clients,leads,tasks,projects,contracts,finance,events,tickets,contents])
  const results=useMemo(()=>{
    const found=searchGlobal(index,query)
    return type==='all' ? found : found.filter((item)=>item.type===type)
  },[index,query,type])
  const availableTypes=useMemo(()=>Array.from(new Set(index.map((item)=>item.type))),[index])

  function updateQuery(value:string){
    setQuery(value)
    const next=new URLSearchParams(params)
    value.trim() ? next.set('q',value) : next.delete('q')
    setParams(next,{replace:true})
  }

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">PESQUISA GLOBAL</span><h1>Encontre qualquer informação</h1><p>Clientes, Leads, tarefas, projetos, contratos, agenda, suporte e marketing.</p></div></header>
    <div className="global-search-hero"><Search size={24}/><input autoFocus value={query} onChange={(event)=>updateQuery(event.target.value)} placeholder="Digite nome, empresa, tarefa, contrato..."/></div>
    <div className="global-search-toolbar">
      <div><SlidersHorizontal size={16}/><strong>Filtrar por tipo</strong></div>
      <button className={type==='all'?'active':''} onClick={()=>setType('all')}>Todos</button>
      {availableTypes.map((item)=><button key={item} className={type===item?'active':''} onClick={()=>setType(item)}>{typeLabels[item]}</button>)}
      <span>{results.length} resultado(s)</span>
    </div>
    <section className="global-search-results">
      {results.map((item)=><button type="button" key={item.id} className="panel-card" onClick={()=>navigate(item.route)}><div className={`global-result-type type-${item.type}`}>{typeLabels[item.type].slice(0,1)}</div><div><span>{typeLabels[item.type]}</span><strong>{item.title}</strong><p>{item.description}</p></div></button>)}
      {query&&!results.length&&<article className="panel-card empty-panel"><strong>Nenhum resultado encontrado</strong><p>Tente usar menos palavras ou selecione “Todos”.</p></article>}
      {!query&&<article className="panel-card empty-panel"><strong>Comece digitando para pesquisar.</strong><p>A pesquisa considera os principais módulos do sistema.</p></article>}
    </section>
  </div>
}
