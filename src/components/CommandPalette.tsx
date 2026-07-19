import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, BriefcaseBusiness, CalendarDays, ContactRound, FileText,
  LayoutDashboard, Plus, Search, Settings, WalletCards
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { buildGlobalSearchIndex, searchGlobal } from '../lib/globalSearch'
import { useCalendarStore } from '../lib/calendarStore'
import { useContractsStore } from '../lib/contractsStore'
import { useCrmStore } from '../lib/crmStore'
import { useFinanceStore } from '../lib/financeStore'
import { useMarketingStore } from '../lib/marketingStore'
import { useProjectsStore } from '../lib/projectsStore'
import { useSupportStore } from '../lib/supportStore'
import { useTasksStore } from '../lib/tasksStore'

const commands = [
  {id:'home',label:'Abrir Visão Geral',description:'Navegar para o dashboard principal',route:'/',icon:LayoutDashboard},
  {id:'new-client',label:'Novo cliente',description:'Abrir cadastro de clientes',route:'/clients',icon:Plus},
  {id:'crm',label:'Abrir CRM',description:'Leads e pipeline comercial',route:'/crm',icon:ContactRound},
  {id:'finance',label:'Abrir Financeiro',description:'Receitas, despesas e fluxo',route:'/finance',icon:WalletCards},
  {id:'projects',label:'Abrir Projetos',description:'Projetos, marcos e progresso',route:'/projects',icon:BriefcaseBusiness},
  {id:'calendar',label:'Abrir Agenda',description:'Compromissos e calendário',route:'/calendar',icon:CalendarDays},
  {id:'reports',label:'Gerar relatório',description:'Abrir central de relatórios',route:'/reports',icon:FileText},
  {id:'settings',label:'Abrir Configurações',description:'Preferências e integrações',route:'/settings',icon:Settings},
  {id:'health',label:'Ver saúde do sistema',description:'Diagnóstico e backups',route:'/system-health',icon:Activity}
]

export function CommandPalette(){
  const navigate=useNavigate()
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const inputRef=useRef<HTMLInputElement>(null)

  const clients=useCrmStore((state)=>state.clients)
  const leads=useCrmStore((state)=>state.leads)
  const tasks=useTasksStore((state)=>state.tasks)
  const projects=useProjectsStore((state)=>state.projects)
  const contracts=useContractsStore((state)=>state.contracts)
  const finance=useFinanceStore((state)=>state.entries)
  const events=useCalendarStore((state)=>state.events)
  const tickets=useSupportStore((state)=>state.tickets)
  const contents=useMarketingStore((state)=>state.contents)

  const index=useMemo(()=>buildGlobalSearchIndex({
    clients,leads,tasks,projects,contracts,finance,events,tickets,contents
  }),[clients,leads,tasks,projects,contracts,finance,events,tickets,contents])

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault()
        setOpen((value)=>!value)
      }
      if(event.key==='Escape') setOpen(false)
    }
    const openHandler=()=>setOpen(true)
    window.addEventListener('keydown',handler)
    window.addEventListener('amv:open-command-palette',openHandler)
    return()=>{ window.removeEventListener('keydown',handler); window.removeEventListener('amv:open-command-palette',openHandler) }
  },[])

  useEffect(()=>{
    if(open) window.setTimeout(()=>inputRef.current?.focus(),40)
    else setQuery('')
  },[open])

  const commandResults=commands.filter((item)=>`${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())).slice(0,6)
  const dataResults=searchGlobal(index,query).slice(0,10)

  function go(route:string){
    navigate(route)
    setOpen(false)
  }

  if(!open) return null

  return <div className="command-palette-backdrop" onMouseDown={()=>setOpen(false)} role="presentation">
    <section className="command-palette" onMouseDown={(event)=>event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className="command-search"><Search size={20}/><input aria-label="Pesquisar comandos e dados" ref={inputRef} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Digite um comando ou pesquise em todo o sistema..."/><kbd>ESC</kbd></div>

      <div className="command-results">
        <span className="command-section-title">Comandos</span>
        {commandResults.map((item)=>{
          const Icon=item.icon
          return <button type="button" key={item.id} onClick={()=>go(item.route)}><div className="command-result-icon"><Icon size={18}/></div><div><strong>{item.label}</strong><span>{item.description}</span></div></button>
        })}

        {query.trim()&&<>
          <span className="command-section-title">Resultados globais</span>
          {dataResults.map((item)=><button type="button" key={item.id} onClick={()=>go(item.route)}><div className={`global-result-type type-${item.type}`}>{item.type.slice(0,1).toUpperCase()}</div><div><strong>{item.title}</strong><span>{item.description}</span></div></button>)}
          {!dataResults.length&&<div className="command-empty">Nenhum dado encontrado.</div>}
        </>}
      </div>

      <footer><span>↑↓ navegar</span><span>Enter para abrir</span><span>Ctrl+K para alternar</span></footer>
    </section>
  </div>
}
