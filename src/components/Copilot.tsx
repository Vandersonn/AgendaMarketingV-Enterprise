import { Bot, Send, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCalendarStore } from '../lib/calendarStore'
import { useCrmStore } from '../lib/crmStore'
import { useFinanceStore } from '../lib/financeStore'
import { useMarketingStore } from '../lib/marketingStore'
import { useAiAgentsStore } from '../lib/aiAgentsStore'
import { calculateExecutiveMetrics } from '../lib/executiveAnalytics'
import { useContractsStore } from '../lib/contractsStore'
import { useProjectsStore } from '../lib/projectsStore'
import { useTasksStore } from '../lib/tasksStore'
import { useSupportStore } from '../lib/supportStore'

export function Copilot() {
  const [open,setOpen]=useState(false)
  const [question,setQuestion]=useState('')
  const [answer,setAnswer]=useState('Olá! Posso analisar os dados locais e sugerir prioridades.')
  const leads=useCrmStore((s)=>s.leads)
  const clients=useCrmStore((s)=>s.clients)
  const events=useCalendarStore((s)=>s.events)
  const contents=useMarketingStore((s)=>s.contents)
  const finance=useFinanceStore((s)=>s.entries)
  const insights=useAiAgentsStore((s)=>s.insights)
  const contracts=useContractsStore((s)=>s.contracts)
  const projects=useProjectsStore((s)=>s.projects)
  const tasks=useTasksStore((s)=>s.tasks)
  const tickets=useSupportStore((s)=>s.tickets)
  const executive=useMemo(()=>calculateExecutiveMetrics({
    clients,leads,finance,contracts,projects,tasks,tickets
  }),[clients,leads,finance,contracts,projects,tasks,tickets])
  const agentInsights=useMemo(
    ()=>insights.filter((item)=>!item.dismissed),
    [insights]
  )

  const context=useMemo(()=>({
    openLeads:leads.filter((l)=>!['won','lost'].includes(l.stage)).length,
    pipeline:leads.filter((l)=>!['won','lost'].includes(l.stage)).reduce((s,l)=>s+l.value,0),
    clients:clients.length,
    overdue:finance.filter((f)=>f.status==='overdue').length,
    review:contents.filter((c)=>c.status==='review').length,
    today:events.filter((e)=>new Date(e.start).toDateString()===new Date().toDateString()).length
  }),[leads,clients,finance,contents,events])

  function ask(){
    const q=question.toLowerCase()
    let result=`Você possui ${context.openLeads} oportunidades abertas, pipeline de ${context.pipeline.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}, ${context.overdue} cobrança(s) vencida(s), ${context.review} conteúdo(s) em revisão e ${context.today} compromisso(s) hoje.`
    if(q.includes('prioridade')||q.includes('hoje')) result=`Prioridades: ${context.overdue?'cobrar valores vencidos; ':''}${context.review?'revisar conteúdos; ':''}${context.openLeads?'executar follow-ups do CRM; ':''}confirmar os ${context.today} compromisso(s) de hoje.`
    if(q.includes('previsão')||q.includes('forecast')) result=`A previsão é ${executive.forecast30.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} para 30 dias e ${executive.forecast90.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} para 90 dias.`
    if(q.includes('cac')||q.includes('ltv')||q.includes('churn')) result=`CAC estimado: ${executive.cac.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}. LTV estimado: ${executive.ltv.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}. Churn estimado: ${executive.churnRate.toFixed(1)}%.`
    if(q.includes('finance')||q.includes('receita')) result=`O pipeline atual é ${context.pipeline.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}. Existem ${context.overdue} cobrança(s) vencida(s). Use o Financeiro para acompanhar a meta e recebimentos.`
    if(q.includes('alerta')||q.includes('insight')) result=agentInsights.length
      ? agentInsights.slice(0,5).map((item)=>`${item.title}: ${item.description}`).join(' ')
      : 'Nenhum insight ativo. Execute os agentes de IA.'
    if(q.includes('marketing')||q.includes('conteúdo')) result=`Há ${context.review} conteúdo(s) aguardando revisão. Recomendo manter pelo menos três publicações agendadas por semana e priorizar formatos de vídeo curto.`
    setAnswer(result);setQuestion('')
  }

  return <>
    <button type="button" className="copilot-button" onClick={()=>setOpen(true)} aria-label="Abrir Copiloto AMV"><Sparkles size={20}/><span>Copiloto</span></button>
    {open&&<div className="copilot-panel">
      <div className="copilot-header"><div><Bot/><strong>Copiloto AMV</strong></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar Copiloto AMV"><X/></button></div>
      <div className="copilot-answer">{answer}</div>
      <div className="copilot-suggestions">{['O que priorizar hoje?','Resumo financeiro','Sugestões de marketing'].map((text)=><button type="button" key={text} onClick={()=>setQuestion(text)}>{text}</button>)}</div>
      <div className="copilot-input"><input value={question} onChange={(e)=>setQuestion(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&ask()} placeholder="Pergunte sobre seus dados..."/><button type="button" onClick={ask} aria-label="Enviar pergunta ao Copiloto"><Send size={17}/></button></div>
      <small>Análise local. Configure IA externa no Estúdio IA para respostas avançadas.</small>
    </div>}
  </>
}
