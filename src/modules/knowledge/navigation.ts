import { BookOpen, Headphones, LibraryBig, PackageSearch, RefreshCw } from 'lucide-react'
import type { NavigationGroup } from '../../app/navigation'
export const navigation: NavigationGroup = { id:'knowledge', label:'Conhecimento e suporte', icon:LibraryBig, order:90, items:[
  {to:'/knowledge',label:'Base de conhecimento',icon:LibraryBig,color:'blue'}, {to:'/support',label:'Suporte e SLA',icon:Headphones,color:'orange',permission:'tasks.view'},
  {to:'/services',label:'Catálogo de serviços',icon:PackageSearch,color:'green',permission:'settings.manage'}, {to:'/updates',label:'Atualizações',icon:RefreshCw,color:'green'}, {to:'/manual',label:'Manual do sistema',icon:BookOpen,color:'blue'},
]}
