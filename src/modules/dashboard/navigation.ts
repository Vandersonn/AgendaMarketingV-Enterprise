import { Goal, LayoutDashboard, LayoutGrid, Radar } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'principal', label:'Principal', icon:LayoutDashboard, order:10, items:[
  {to:'/',label:'Visão geral',icon:LayoutDashboard,color:'blue',permission:'dashboard.view'},
  {to:'/executive',label:'Painel Executivo',icon:Radar,color:'purple',permission:'dashboard.view'},
  {to:'/workspace',label:'Espaço de Trabalho',icon:LayoutGrid,color:'blue',permission:'dashboard.view'},
  {to:'/goals',label:'Metas e OKRs',icon:Goal,color:'green',permission:'dashboard.view'},
]}
