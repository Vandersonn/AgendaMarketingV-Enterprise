import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '../hooks/useTheme'
import { Copilot } from './Copilot'
import { Onboarding } from './Onboarding'
import { CommandPalette } from './CommandPalette'
import { CloudAutoSync } from './CloudAutoSync'
import { useBackupStore } from '../lib/backupStore'
import { useAiAgentsStore } from '../lib/aiAgentsStore'
import { analyzeAgent } from '../lib/agentAnalysis'
import { useCrmStore } from '../lib/crmStore'
import { useFinanceStore } from '../lib/financeStore'
import { useMarketingStore } from '../lib/marketingStore'
import { useProjectsStore } from '../lib/projectsStore'
import { useTasksStore } from '../lib/tasksStore'
import { useSupportStore } from '../lib/supportStore'
import { useContractsStore } from '../lib/contractsStore'
import { useCalendarStore } from '../lib/calendarStore'
import { ErrorBoundary } from './ErrorBoundary'
import { useWhiteLabelStore } from '../lib/whiteLabelStore'

const titles:Record<string,string>={
  '/':'Visão geral','/crm':'CRM','/clients':'Clientes','/contracts':'Contratos',
  '/calendar':'Agenda','/tasks':'Tarefas','/notifications':'Notificações','/projects':'Projetos','/goals':'Metas e OKRs','/client-health':'Saúde dos clientes','/support':'Suporte e SLA','/knowledge':'Base de conhecimento','/services':'Catálogo de serviços','/system-health':'Saúde do sistema','/integration-hub':'Hub de conexões','/ai-agents':'Agentes de IA','/executive':'Painel Executivo','/organizations':'Empresas','/license':'Licença e planos','/workspace':'Espaço de Trabalho Titanium','/crm-intelligence':'CRM Inteligente','/cloud-sync':'Sincronização em Nuvem','/security-center':'Segurança','/launch-readiness':'Prontidão de lançamento','/app-center':'Central de Aplicativos','/global-search':'Pesquisa Global','/missions':'Central de Missões','/event-bus':'Barramento de Eventos','/automation-suggestions':'Automações sugeridas','/release-candidate':'Homologação RC','/diagnostic-center':'Central de Diagnósticos','/error-center':'Central de Erros','/performance-center':'Central de Desempenho','/recovery-center':'Central de Recuperação','/marketplace':'Marketplace','/white-label':'Marca Personalizada','/plugin-manager':'Gerenciador de Extensões','/ai-executive':'Executivo de IA','/cloud-connect':'Conexões em Nuvem','/license-authority':'Autoridade de licenças','/licensing-control':'Controle de licenças','/devvanderson-portal':'Portal DEVVANDERSON','/lead-scoring':'Pontuação de Leads','/marketing':'Marketing','/content-calendar':'Calendário editorial',
  '/approvals':'Aprovações','/ai-studio':'Estúdio IA','/whatsapp':'WhatsApp',
  '/metrics':'Métricas','/finance':'Financeiro','/automations':'Automações',
  '/integrations':'Integrações','/team':'Equipe','/audit':'Auditoria',
  '/reports':'Relatórios','/settings':'Configurações','/business-profile':'Perfil do negócio','/manual':'Manual do sistema','/client-360':'Cliente 360º','/documents':'Documentos','/updates':'Atualizações','/client-portal':'Portal do cliente','/proposal-builder':'Propostas'
}
export function Layout(){
  const[collapsed,setCollapsed]=useState(false)
  const{theme,toggleTheme}=useTheme()
  const location=useLocation()
  const whiteLabel=useWhiteLabelStore((state)=>state.settings)
  const runAutomaticBackupIfNeeded=useBackupStore((state)=>state.runAutomaticBackupIfNeeded)
  const runDueAgents=useAiAgentsStore((state)=>state.runDueAgents)
  const clients=useCrmStore((state)=>state.clients)
  const leads=useCrmStore((state)=>state.leads)
  const finance=useFinanceStore((state)=>state.entries)
  const contents=useMarketingStore((state)=>state.contents)
  const projects=useProjectsStore((state)=>state.projects)
  const tasks=useTasksStore((state)=>state.tasks)
  const tickets=useSupportStore((state)=>state.tickets)
  const contracts=useContractsStore((state)=>state.contracts)
  const events=useCalendarStore((state)=>state.events)

  useEffect(()=>{
    const runAgents=()=>runDueAgents((agent)=>analyzeAgent(agent,{clients,leads,finance,contents,projects,tasks,tickets,contracts,events}))

    const startupTimer=window.setTimeout(()=>{
      try {
        runAutomaticBackupIfNeeded()
        runAgents()
      } catch (error) {
        console.error('AgendaMarketingV background startup error:', error)
      }
    },1500)

    const intervalTimer=window.setInterval(()=>{
      try {
        runAutomaticBackupIfNeeded()
        runAgents()
      } catch (error) {
        console.error('AgendaMarketingV background task error:', error)
      }
    },60*60*1000)

    return()=>{
      window.clearTimeout(startupTimer)
      window.clearInterval(intervalTimer)
    }
  },[runAutomaticBackupIfNeeded,runDueAgents,clients,leads,finance,contents,projects,tasks,tickets,contracts,events])
  useEffect(()=>{ document.title=whiteLabel.productName; document.documentElement.style.setProperty('--primary',whiteLabel.primaryColor) },[whiteLabel.productName,whiteLabel.primaryColor])
  return <div className={`app-shell ${collapsed?'menu-collapsed':''}`}>
    <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(v=>!v)} theme={theme} onThemeToggle={toggleTheme}/>
    <div className="app-content"><Topbar title={titles[location.pathname]||'AgendaMarketingV'} onMenuToggle={()=>setCollapsed(v=>!v)} theme={theme} onThemeToggle={toggleTheme}/>
    <main className="app-main"><ErrorBoundary><Outlet/></ErrorBoundary></main><Copilot/><Onboarding/>
      <CommandPalette/>
      <CloudAutoSync/></div>
  </div>
}
