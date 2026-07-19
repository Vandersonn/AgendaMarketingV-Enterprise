import { ArchiveRestore, Boxes, Bug, Gauge, KeyRound, Palette, Radio, Rocket, ScrollText, Settings, ShieldCheck, Store, TestTube2, Trash2, UsersRound, Stethoscope, PackageCheck } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup[] = [
 { id:'admin', label:'Administração', icon:Settings, order:100, items:[
  {to:'/settings',label:'Configurações',icon:Settings,color:'slate',permission:'settings.manage'}, {to:'/business-profile',label:'Perfil do negócio',icon:Boxes,color:'purple',permission:'settings.manage'},
  {to:'/team',label:'Equipe',icon:UsersRound,color:'blue',permission:'team.manage'}, {to:'/access-control',label:'Acessos e permissões',icon:KeyRound,color:'red',permission:'team.manage'},
  {to:'/audit',label:'Auditoria',icon:ScrollText,color:'slate',permission:'audit.view'}, {to:'/security-center',label:'Segurança',icon:ShieldCheck,color:'green',permission:'settings.manage'},
  {to:'/white-label',label:'Marca Personalizada',icon:Palette,color:'pink',permission:'settings.manage'}, {to:'/trash',label:'Lixeira',icon:Trash2,color:'red',permission:'settings.manage'},
 ]},
 { id:'system', label:'Sistema', icon:Gauge, order:110, items:[
  {to:'/platform-core',label:'Platform Core',icon:Boxes,color:'purple',permission:'settings.manage'}, {to:'/system-health',label:'Saúde do sistema',icon:Gauge,color:'orange',permission:'settings.manage'},
  {to:'/diagnostic-center',label:'Central de Diagnósticos',icon:Stethoscope,color:'blue',permission:'settings.manage'}, {to:'/error-center',label:'Central de Erros',icon:Bug,color:'red',permission:'settings.manage'},
  {to:'/performance-center',label:'Desempenho',icon:Gauge,color:'green',permission:'settings.manage'}, {to:'/recovery-center',label:'Recuperação',icon:ArchiveRestore,color:'purple',permission:'settings.manage'},
  {to:'/marketplace',label:'Marketplace',icon:Store,color:'purple',permission:'settings.manage'}, {to:'/plugin-manager',label:'Extensões',icon:PackageCheck,color:'orange',permission:'settings.manage'},
  {to:'/event-bus',label:'Barramento de Eventos',icon:Radio,color:'blue',permission:'settings.manage'}, {to:'/release-candidate',label:'Homologação RC',icon:TestTube2,color:'orange',permission:'settings.manage'}, {to:'/launch-readiness',label:'Prontidão de lançamento',icon:Rocket,color:'purple',permission:'settings.manage'},
 ]}
]
