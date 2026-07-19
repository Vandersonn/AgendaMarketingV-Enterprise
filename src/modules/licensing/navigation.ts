import { BadgeCheck, Cloud, KeyRound } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'licensing', label:'Licenciamento', icon:KeyRound, order:120, items:[
  {to:'/license',label:'Licença e planos',icon:KeyRound,color:'orange'}, {to:'/license-authority',label:'Gerador de licenças',icon:KeyRound,color:'red',ownerOnly:true},
  {to:'/licensing-control',label:'Controle de licenças',icon:BadgeCheck,color:'purple',ownerOnly:true}, {to:'/devvanderson-portal',label:'Portal DEVVANDERSON',icon:Cloud,color:'blue',ownerOnly:true},
]}
