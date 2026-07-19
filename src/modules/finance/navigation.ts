import { BarChart3, Landmark } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'finance', label:'Financeiro', icon:Landmark, order:70, items:[
  {to:'/finance',label:'Financeiro',icon:Landmark,color:'green',permission:'finance.view'}, {to:'/reports',label:'Relatórios',icon:BarChart3,color:'pink',permission:'reports.view'},
]}
