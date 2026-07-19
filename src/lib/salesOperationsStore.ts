import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import type { SalesStatus } from './salesStore'

export interface SalesCustomer { id:string; name:string; company:string; email:string; phone:string; segment:string; source:string; createdAt:string }
export interface SalesProduct { id:string; name:string; category:string; price:number; cost:number; recurring:boolean; active:boolean }
export interface ProposalItem { id:string; productId:string; description:string; quantity:number; unitPrice:number; discount:number }
export interface SalesProposal { id:string; number:string; customerId:string; opportunityId?:string; title:string; items:ProposalItem[]; status:'draft'|'sent'|'viewed'|'accepted'|'rejected'|'expired'; validUntil:string; notes:string; createdAt:string }

interface State {
  customers:SalesCustomer[]; products:SalesProduct[]; proposals:SalesProposal[]
  addCustomer:(data:Omit<SalesCustomer,'id'|'createdAt'>)=>void
  addProduct:(data:Omit<SalesProduct,'id'>)=>void
  addProposal:(data:Omit<SalesProposal,'id'|'number'|'createdAt'>)=>void
  updateProposalStatus:(id:string,status:SalesProposal['status'])=>void
  removeCustomer:(id:string)=>void; removeProduct:(id:string)=>void; removeProposal:(id:string)=>void
}

const now=()=>new Date().toISOString()
const defaults={
  customers:[
    {id:'customer_1',name:'Mariana Souza',company:'Clínica Vital',email:'mariana@clinicavital.com',phone:'(31) 99999-1111',segment:'Saúde',source:'Instagram',createdAt:now()},
    {id:'customer_2',name:'Carlos Mendes',company:'Mendes Advocacia',email:'carlos@mendes.adv.br',phone:'(11) 98888-4412',segment:'Jurídico',source:'Indicação',createdAt:now()}
  ] as SalesCustomer[],
  products:[
    {id:'product_1',name:'Gestão de tráfego pago',category:'Marketing',price:2500,cost:700,recurring:true,active:true},
    {id:'product_2',name:'Gestão de redes sociais',category:'Marketing',price:2200,cost:650,recurring:true,active:true},
    {id:'product_3',name:'Site institucional WordPress',category:'Desenvolvimento',price:6500,cost:1800,recurring:false,active:true},
    {id:'product_4',name:'Landing page de conversão',category:'Desenvolvimento',price:3900,cost:950,recurring:false,active:true}
  ] as SalesProduct[],
  proposals:[] as SalesProposal[]
}
const saved=loadLocal('sales_operations_v1',defaults)
const persist=(state:Pick<State,'customers'|'products'|'proposals'>)=>saveLocal('sales_operations_v1',state)
export const proposalTotal=(proposal:Pick<SalesProposal,'items'>)=>proposal.items.reduce((sum,item)=>sum+(item.quantity*item.unitPrice)*(1-item.discount/100),0)
export const useSalesOperationsStore=create<State>((set)=>({
  ...saved,
  addCustomer:(data)=>set(state=>{const customers=[{...data,id:crypto.randomUUID(),createdAt:now()},...state.customers];persist({...state,customers});return{customers}}),
  addProduct:(data)=>set(state=>{const products=[{...data,id:crypto.randomUUID()},...state.products];persist({...state,products});return{products}}),
  addProposal:(data)=>set(state=>{const serial=String(state.proposals.length+1).padStart(4,'0');const proposals=[{...data,id:crypto.randomUUID(),number:`PROP-${new Date().getFullYear()}-${serial}`,createdAt:now()},...state.proposals];persist({...state,proposals});return{proposals}}),
  updateProposalStatus:(id,status)=>set(state=>{const proposals=state.proposals.map(p=>p.id===id?{...p,status}:p);persist({...state,proposals});return{proposals}}),
  removeCustomer:(id)=>set(state=>{const customers=state.customers.filter(x=>x.id!==id);persist({...state,customers});return{customers}}),
  removeProduct:(id)=>set(state=>{const products=state.products.filter(x=>x.id!==id);persist({...state,products});return{products}}),
  removeProposal:(id)=>set(state=>{const proposals=state.proposals.filter(x=>x.id!==id);persist({...state,proposals});return{proposals}})
}))
export const salesStageLabels:Record<SalesStatus,string>={prospecting:'Prospecção',qualification:'Qualificação',diagnosis:'Diagnóstico',proposal:'Proposta',negotiation:'Negociação',won:'Ganho',lost:'Perdido'}
