import { CalendarDays, Megaphone, MessageCircle, Workflow } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'marketing', label:'Marketing', icon:Megaphone, order:50, items:[
  {to:'/marketing',label:'Marketing',icon:Megaphone,color:'pink',permission:'marketing.view'}, {to:'/content-calendar',label:'Calendário editorial',icon:CalendarDays,color:'orange'},
  {to:'/whatsapp',label:'WhatsApp',icon:MessageCircle,color:'green'}, {to:'/automations',label:'Automações',icon:Workflow,color:'purple'}, {to:'/automation-suggestions',label:'Automações sugeridas',icon:Workflow,color:'green',permission:'dashboard.view'},
]}
