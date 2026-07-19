import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useEventBusStore } from './eventBusStore'

export type PlatformModule = {
  id:string; name:string; description:string; version:string; enabled:boolean; category:'core'|'commercial'|'operations'|'intelligence'; dependencies:string[]
}
export type Tenant = { id:string; name:string; document:string; active:boolean; color:string }
export type PlatformNotification = { id:string; title:string; message:string; level:'info'|'warning'|'success'; read:boolean; createdAt:string }

type State={
  modules:PlatformModule[]; tenants:Tenant[]; activeTenantId:string; notifications:PlatformNotification[];
  toggleModule:(id:string)=>void; setActiveTenant:(id:string)=>void; addTenant:(name:string,document:string)=>void; markRead:(id:string)=>void; publishHealthCheck:()=>void
}
const defaultModules:PlatformModule[]=[
{id:'crm',name:'CRM Enterprise',description:'Kanban, scoring, SLA, follow-up e distribuição.',version:'16.0.0',enabled:true,category:'commercial',dependencies:['core']},
{id:'campaigns',name:'Campanhas e Cadências',description:'Orquestração de contatos consentidos.',version:'16.0.0',enabled:true,category:'commercial',dependencies:['crm']},
{id:'finance',name:'Financeiro',description:'Receitas, despesas e visão financeira.',version:'16.0.0',enabled:true,category:'operations',dependencies:['core']},
{id:'intelligence',name:'Inteligência Comercial',description:'Dashboards, recomendações e scoring.',version:'16.0.0',enabled:true,category:'intelligence',dependencies:['crm']},
{id:'marketplace',name:'Marketplace',description:'Catálogo e ativação de extensões.',version:'16.0.0',enabled:true,category:'core',dependencies:['core']},
{id:'core',name:'Platform Core',description:'Identidade, eventos, permissões e armazenamento.',version:'16.0.0',enabled:true,category:'core',dependencies:[]}
]
const initialTenants:Tenant[]=[{id:'main',name:'Empresa principal',document:'Não informado',active:true,color:'#6d5dfc'}]
const key='platform_core_rc160'
const saved=loadLocal<Pick<State,'modules'|'tenants'|'activeTenantId'|'notifications'>>(key,{modules:defaultModules,tenants:initialTenants,activeTenantId:'main',notifications:[]})
const persist=(state:State)=>saveLocal(key,{modules:state.modules,tenants:state.tenants,activeTenantId:state.activeTenantId,notifications:state.notifications})
export const usePlatformCoreStore=create<State>((set,get)=>({
...saved,
toggleModule:(id)=>set(state=>{ if(id==='core') return state; const modules=state.modules.map(m=>m.id===id?{...m,enabled:!m.enabled}:m); const next={...state,modules}; persist(next as State); useEventBusStore.getState().publish({type:'system.custom',source:'platform-core',title:'Módulo atualizado',description:`O módulo ${modules.find(m=>m.id===id)?.name} foi ${modules.find(m=>m.id===id)?.enabled?'ativado':'desativado'}.`,entityId:id,payload:{moduleId:id,enabled:modules.find(m=>m.id===id)?.enabled}}); return {modules} }),
setActiveTenant:(id)=>set(state=>{const tenants=state.tenants.map(t=>({...t,active:t.id===id})); const next={...state,tenants,activeTenantId:id}; persist(next as State); return {tenants,activeTenantId:id}}),
addTenant:(name,document)=>set(state=>{const tenant={id:crypto.randomUUID(),name,document,active:false,color:'#0ea5e9'}; const tenants=[...state.tenants,tenant]; const notifications=[{id:crypto.randomUUID(),title:'Nova empresa adicionada',message:`${name} está pronta para configuração.`,level:'success' as const,read:false,createdAt:new Date().toISOString()},...state.notifications]; const next={...state,tenants,notifications}; persist(next as State); return {tenants,notifications}}),
markRead:(id)=>set(state=>{const notifications=state.notifications.map(n=>n.id===id?{...n,read:true}:n); const next={...state,notifications}; persist(next as State); return {notifications}}),
publishHealthCheck:()=>{useEventBusStore.getState().publish({type:'system.custom',source:'platform-core',title:'Verificação da plataforma concluída',description:`${get().modules.filter(m=>m.enabled).length} módulos ativos e ${get().tenants.length} empresa(s) registrada(s).`,entityId:'platform-core',payload:{activeModules:get().modules.filter(m=>m.enabled).length,tenants:get().tenants.length}}); set(state=>{const notifications=[{id:crypto.randomUUID(),title:'Plataforma saudável',message:'Core modular, eventos e contexto multiempresa operacionais.',level:'success' as const,read:false,createdAt:new Date().toISOString()},...state.notifications]; const next={...state,notifications}; persist(next as State); return {notifications}})}
}))
