import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type PluginStatus = 'active' | 'disabled' | 'error'
export type PluginCategory = 'core' | 'business' | 'marketing' | 'analytics' | 'integration' | 'system'

export interface AppPlugin {
  id: string
  name: string
  description: string
  version: string
  category: PluginCategory
  route: string
  icon: string
  status: PluginStatus
  requiredPlan: 'free' | 'pro' | 'enterprise'
  updatedAt: string
}

interface PluginRegistryState {
  plugins: AppPlugin[]
  toggle: (id: string) => void
  register: (plugin: AppPlugin) => void
  uninstall: (id: string) => void
  reset: () => void
}

const defaults: AppPlugin[] = [
  { id:'dashboard', name:'Visão Geral', description:'Resumo operacional do sistema.', version:'21.0.0', category:'core', route:'/', icon:'LayoutDashboard', status:'active', requiredPlan:'free', updatedAt:new Date().toISOString() },
  { id:'workspace', name:'Espaço de Trabalho Titanium', description:'Dashboard configurável por widgets.', version:'21.0.0', category:'analytics', route:'/workspace', icon:'LayoutGrid', status:'active', requiredPlan:'free', updatedAt:new Date().toISOString() },
  { id:'crm', name:'CRM', description:'Leads, clientes e pipeline comercial.', version:'21.0.0', category:'business', route:'/crm', icon:'ContactRound', status:'active', requiredPlan:'free', updatedAt:new Date().toISOString() },
  { id:'finance', name:'Financeiro', description:'Receitas, despesas e previsões.', version:'21.0.0', category:'business', route:'/finance', icon:'WalletCards', status:'active', requiredPlan:'pro', updatedAt:new Date().toISOString() },
  { id:'projects', name:'Projetos', description:'Projetos, marcos e progresso.', version:'21.0.0', category:'business', route:'/projects', icon:'BriefcaseBusiness', status:'active', requiredPlan:'pro', updatedAt:new Date().toISOString() },
  { id:'marketing', name:'Marketing', description:'Conteúdo, calendário e campanhas.', version:'21.0.0', category:'marketing', route:'/marketing', icon:'Megaphone', status:'active', requiredPlan:'free', updatedAt:new Date().toISOString() },
  { id:'ai', name:'Agentes de IA', description:'Análises comerciais, financeiras e operacionais.', version:'21.0.0', category:'analytics', route:'/ai-agents', icon:'BrainCircuit', status:'active', requiredPlan:'pro', updatedAt:new Date().toISOString() },
  { id:'support', name:'Suporte e SLA', description:'Chamados, respostas e satisfação.', version:'21.0.0', category:'business', route:'/support', icon:'Headphones', status:'active', requiredPlan:'free', updatedAt:new Date().toISOString() },
  { id:'integrations', name:'Hub de Conexões', description:'Webhooks e integrações externas.', version:'21.0.0', category:'integration', route:'/integration-hub', icon:'Cable', status:'active', requiredPlan:'pro', updatedAt:new Date().toISOString() },
  { id:'health', name:'Saúde do Sistema', description:'Diagnóstico, backup e logs técnicos.', version:'21.0.0', category:'system', route:'/system-health', icon:'Activity', status:'active', requiredPlan:'free', updatedAt:new Date().toISOString() }
]

const initial = loadLocal<AppPlugin[]>('plugin_registry', defaults)

function persist(plugins: AppPlugin[]) {
  saveLocal('plugin_registry', plugins)
}

export const usePluginRegistryStore = create<PluginRegistryState>((set)=>({
  plugins: Array.isArray(initial) && initial.length ? initial : defaults,

  toggle: (id)=>set((state)=>{
    const plugins=state.plugins.map((item)=>item.id===id?{
      ...item,
      status:(item.status==='active'?'disabled':'active') as PluginStatus,
      updatedAt:new Date().toISOString()
    }:item)
    persist(plugins)
    logSystem('info','Plugins',`Plugin ${id} alterado`,'Status atualizado.')
    return {plugins}
  }),

  register: (plugin)=>set((state)=>{
    const exists=state.plugins.some((item)=>item.id===plugin.id)
    const plugins=exists
      ? state.plugins.map((item)=>item.id===plugin.id?plugin:item)
      : [plugin,...state.plugins]
    persist(plugins)
    return {plugins}
  }),

  uninstall: (id)=>set((state)=>{
    const protectedIds=new Set(['dashboard','crm','health'])
    if(protectedIds.has(id)) return state
    const plugins=state.plugins.filter((item)=>item.id!==id)
    persist(plugins)
    return {plugins}
  }),

  reset: ()=>{
    persist(defaults)
    set({plugins:defaults})
  }
}))
