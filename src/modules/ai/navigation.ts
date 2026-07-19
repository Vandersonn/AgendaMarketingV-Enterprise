import { Bot, BrainCircuit, Crown } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'ai', label:'Inteligência Artificial', icon:Bot, order:60, items:[
  {to:'/ai-studio',label:'Estúdio IA',icon:Bot,color:'blue'}, {to:'/ai-agents',label:'Agentes de IA',icon:BrainCircuit,color:'purple',permission:'dashboard.view'}, {to:'/ai-executive',label:'Executivo de IA',icon:Crown,color:'orange',permission:'dashboard.view'},
]}
