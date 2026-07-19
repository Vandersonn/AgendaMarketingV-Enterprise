import { BadgeCheck, BriefcaseBusiness, CalendarDays, FileSignature, FolderOpen, ListTodo, ReceiptText } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'work', label:'Trabalho', icon:ListTodo, order:40, items:[
  {to:'/calendar',label:'Agenda',icon:CalendarDays,color:'orange'}, {to:'/tasks',label:'Tarefas',icon:ListTodo,color:'orange',permission:'tasks.view'},
  {to:'/projects',label:'Projetos',icon:BriefcaseBusiness,color:'purple',permission:'tasks.view'}, {to:'/documents',label:'Documentos',icon:FolderOpen,color:'purple'},
  {to:'/approvals',label:'Aprovações',icon:BadgeCheck,color:'green'}, {to:'/contracts',label:'Contratos',icon:FileSignature,color:'purple'}, {to:'/proposal-builder',label:'Propostas',icon:ReceiptText,color:'green'},
]}
