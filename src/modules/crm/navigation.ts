import { BadgeDollarSign, BriefcaseBusiness, CalendarClock, ContactRound, Flame, MessageCircle, Shuffle, Sparkles, TimerReset } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'commercial', label:'Comercial', icon:BriefcaseBusiness, order:20, items:[
  {to:'/crm',label:'CRM',icon:ContactRound,color:'purple',permission:'crm.view'}, {to:'/sales',label:'Central de Vendas',icon:BadgeDollarSign,color:'green',permission:'crm.view'},
  {to:'/sales-workspace',label:'Espaço de Vendas',icon:BriefcaseBusiness,color:'green',permission:'crm.view'}, {to:'/contact-campaigns',label:'Campanhas e cadências',icon:MessageCircle,color:'green',permission:'crm.view'},
  {to:'/follow-ups',label:'Acompanhamentos',icon:CalendarClock,color:'orange',permission:'crm.view'}, {to:'/lead-distribution',label:'Distribuição de leads',icon:Shuffle,color:'blue',permission:'crm.view'},
  {to:'/lead-scoring',label:'Pontuação de Leads',icon:Flame,color:'orange',permission:'crm.view'}, {to:'/commercial-sla',label:'SLA comercial',icon:TimerReset,color:'red',permission:'crm.view'},
  {to:'/crm-intelligence',label:'CRM Inteligente',icon:Sparkles,color:'orange',permission:'crm.view'},
]}
