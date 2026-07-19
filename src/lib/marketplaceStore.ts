import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { usePluginRegistryStore, type AppPlugin } from './pluginRegistryStore'

export type MarketplaceCategory='segment'|'productivity'|'integration'|'analytics'
export interface MarketplaceModule {id:string;name:string;description:string;category:MarketplaceCategory;industry:string;plan:'free'|'pro'|'enterprise';version:string;route:string;features:string[]}

export const marketplaceCatalog:MarketplaceModule[]=[
 {id:'education-suite',name:'Educação e Cursos',description:'Cursos, turmas, matrículas, frequência e certificados.',category:'segment',industry:'Educação',plan:'pro',version:'1.0.0',route:'/business-profile',features:['Cursos e turmas','Matrículas','Certificados']},
 {id:'clinic-suite',name:'Clínicas e Saúde',description:'Pacientes, atendimentos, convênios e agenda clínica.',category:'segment',industry:'Saúde',plan:'pro',version:'1.0.0',route:'/business-profile',features:['Pacientes','Agenda','Atendimentos']},
 {id:'real-estate-suite',name:'Imobiliária',description:'Imóveis, captação, propostas, vendas e locações.',category:'segment',industry:'Imobiliário',plan:'pro',version:'1.0.0',route:'/business-profile',features:['Imóveis','Captação','Locações']},
 {id:'custom-fields',name:'Campos Personalizados',description:'Crie campos próprios para cadastros sem alterar o núcleo.',category:'productivity',industry:'Todos',plan:'pro',version:'1.0.0',route:'/business-profile',features:['Texto e número','Listas','Campos obrigatórios']},
 {id:'flow-builder',name:'Flow Builder',description:'Automatize processos com gatilhos, condições e ações.',category:'productivity',industry:'Todos',plan:'enterprise',version:'1.0.0',route:'/automations',features:['Gatilhos','Condições','Ações']},
 {id:'whatsapp-connect',name:'WhatsApp Connect',description:'Centralize conversas e follow-ups comerciais.',category:'integration',industry:'Todos',plan:'pro',version:'1.0.0',route:'/whatsapp',features:['Conversas','Templates','Follow-up']},
 {id:'executive-analytics',name:'Executive Analytics',description:'Indicadores, previsões e recomendações executivas.',category:'analytics',industry:'Todos',plan:'enterprise',version:'1.0.0',route:'/executive',features:['Forecast','KPIs','Recomendações']}
]
interface State{installedIds:string[];install:(item:MarketplaceModule)=>void;remove:(id:string)=>void}
const initial=loadLocal<string[]>('marketplace_installed',[])
export const useMarketplaceStore=create<State>((set)=>({installedIds:initial,
 install:(item)=>set((state)=>{if(state.installedIds.includes(item.id))return state;const installedIds=[...state.installedIds,item.id];saveLocal('marketplace_installed',installedIds);const plugin:AppPlugin={id:item.id,name:item.name,description:item.description,version:item.version,category:item.category==='integration'?'integration':item.category==='analytics'?'analytics':'business',route:item.route,icon:'Package',status:'active',requiredPlan:item.plan,updatedAt:new Date().toISOString()};usePluginRegistryStore.getState().register(plugin);return{installedIds}}),
 remove:(id)=>set((state)=>{const installedIds=state.installedIds.filter((item)=>item!==id);saveLocal('marketplace_installed',installedIds);usePluginRegistryStore.getState().uninstall(id);return{installedIds}})
}))
