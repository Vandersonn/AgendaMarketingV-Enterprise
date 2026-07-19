import { Building2, HeartPulse, PanelTopOpen, ScanSearch, UsersRound } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'clients', label:'Clientes', icon:UsersRound, order:30, items:[
  {to:'/clients',label:'Clientes',icon:UsersRound,color:'green',permission:'clients.view'}, {to:'/client-360',label:'Cliente 360º',icon:ScanSearch,color:'blue'},
  {to:'/client-health',label:'Saúde dos clientes',icon:HeartPulse,color:'green',permission:'clients.view'}, {to:'/client-portal',label:'Portal do cliente',icon:PanelTopOpen,color:'blue'},
  {to:'/organizations',label:'Empresas',icon:Building2,color:'blue',permission:'settings.manage'},
]}
