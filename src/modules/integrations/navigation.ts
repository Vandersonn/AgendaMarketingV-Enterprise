import { UsersRound, Cable, Cloud, CloudCog, Grid2X2, Plug } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'integrations', label:'Integrações', icon:Plug, order:80, items:[
  {to:'/integrations',label:'Integrações',icon:Plug,color:'purple',permission:'integrations.manage'}, {to:'/integration-hub',label:'Hub de conexões',icon:Cable,color:'blue',permission:'integrations.manage'},
  {to:'/contacts-sync',label:'Sincronizar Contatos',icon:UsersRound,color:'blue',permission:'integrations.manage'},
  {to:'/cloud-sync',label:'Sincronização em Nuvem',icon:Cloud,color:'blue',permission:'settings.manage'}, {to:'/cloud-connect',label:'Proton e Google Drive',icon:CloudCog,color:'purple',permission:'settings.manage'}, {to:'/app-center',label:'Central de Aplicativos',icon:Grid2X2,color:'purple'},
]}
