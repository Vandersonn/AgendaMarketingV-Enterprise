import type { Client, Lead } from './crmTypes'
import type { WorkTask } from './tasksStore'
import type { Project } from './projectsStore'
import type { Contract } from './contractsStore'
import type { FinanceEntry } from './financeStore'
import type { CalendarEvent } from './calendarStore'
import type { SupportTicket } from './supportStore'
import type { ContentItem } from './marketingStore'

export interface GlobalSearchResult {
  id: string
  type: 'client' | 'lead' | 'task' | 'project' | 'contract' | 'finance' | 'calendar' | 'support' | 'marketing'
  title: string
  description: string
  route: string
  keywords: string
}

export function buildGlobalSearchIndex(input: {
  clients: Client[]
  leads: Lead[]
  tasks: WorkTask[]
  projects: Project[]
  contracts: Contract[]
  finance: FinanceEntry[]
  events: CalendarEvent[]
  tickets: SupportTicket[]
  contents: ContentItem[]
}): GlobalSearchResult[] {
  return [
    ...input.clients.map((item)=>({
      id:`client-${item.id}`,
      type:'client' as const,
      title:item.name,
      description:`Cliente • ${item.company || item.email || item.phone || 'Sem detalhes'}`,
      route:`/client-360?client=${item.id}`,
      keywords:`${item.name} ${item.company} ${item.email} ${item.phone}`
    })),
    ...input.leads.map((item)=>({
      id:`lead-${item.id}`,
      type:'lead' as const,
      title:item.name,
      description:`Lead • ${item.company || item.stage} • ${item.value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,
      route:'/crm',
      keywords:`${item.name} ${item.company} ${item.stage} ${item.source} ${item.email} ${item.phone}`
    })),
    ...input.tasks.map((item)=>({
      id:`task-${item.id}`,
      type:'task' as const,
      title:item.title,
      description:`Tarefa • ${item.status} • ${item.assigneeEmail}`,
      route:'/tasks',
      keywords:`${item.title} ${item.description} ${item.status} ${item.assigneeEmail}`
    })),
    ...input.projects.map((item)=>({
      id:`project-${item.id}`,
      type:'project' as const,
      title:item.name,
      description:`Projeto • ${item.status} • ${item.progress}%`,
      route:'/projects',
      keywords:`${item.name} ${item.description} ${item.ownerEmail} ${item.status}`
    })),
    ...input.contracts.map((item)=>({
      id:`contract-${item.id}`,
      type:'contract' as const,
      title:item.title,
      description:`Contrato • ${item.status}`,
      route:'/contracts',
      keywords:`${item.title} ${item.status} ${item.notes}`
    })),
    ...input.finance.map((item)=>({
      id:`finance-${item.id}`,
      type:'finance' as const,
      title:item.description,
      description:`${item.type==='income'?'Receita':'Despesa'} • ${item.status}`,
      route:'/finance',
      keywords:`${item.description} ${item.category} ${item.status} ${item.value}`
    })),
    ...input.events.map((item)=>({
      id:`event-${item.id}`,
      type:'calendar' as const,
      title:item.title,
      description:`Agenda • ${new Date(item.start).toLocaleString('pt-BR')}`,
      route:'/calendar',
      keywords:`${item.title} ${item.notes} ${item.type} ${item.status}`
    })),
    ...input.tickets.map((item)=>({
      id:`ticket-${item.id}`,
      type:'support' as const,
      title:`${item.code} — ${item.subject}`,
      description:`Suporte • ${item.status} • ${item.priority}`,
      route:'/support',
      keywords:`${item.code} ${item.subject} ${item.description} ${item.category}`
    })),
    ...input.contents.map((item)=>({
      id:`content-${item.id}`,
      type:'marketing' as const,
      title:item.title,
      description:`Conteúdo • ${item.status} • ${item.network}`,
      route:'/marketing',
      keywords:`${item.title} ${item.caption} ${item.network} ${item.format} ${item.status}`
    }))
  ]
}

export function searchGlobal(index: GlobalSearchResult[], query: string): GlobalSearchResult[] {
  const normalized=query.trim().toLowerCase()
  if(!normalized) return []
  const terms=normalized.split(/\s+/).filter(Boolean)

  return index
    .map((item)=>{
      const haystack=`${item.title} ${item.description} ${item.keywords}`.toLowerCase()
      const score=terms.reduce((sum,term)=>{
        if(item.title.toLowerCase().includes(term)) return sum+5
        if(item.description.toLowerCase().includes(term)) return sum+3
        if(haystack.includes(term)) return sum+1
        return sum
      },0)
      return {item,score}
    })
    .filter((entry)=>entry.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,30)
    .map((entry)=>entry.item)
}
