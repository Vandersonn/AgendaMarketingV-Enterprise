import { ChevronDown, ChevronLeft, ChevronRight, Clock3, LogOut, Star } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Button } from './Button'
import { useAuthStore } from '../lib/authStore'
import { useWhiteLabelStore } from '../lib/whiteLabelStore'
import type { ThemeMode } from '../lib/types'
import { roleForEmail } from '../lib/permissions'
import { useAuthorizationStore } from '../lib/authorizationStore'
import { useTeamStore } from '../lib/teamStore'
import { moduleForPath, useBusinessProfileStore } from '../lib/businessProfileStore'
import { navigationGroups } from '../app/navigationRegistry'
import type { NavigationGroup, NavigationItem } from '../app/navigation'
import { useNavigationPreferencesStore } from '../lib/navigationPreferencesStore'

interface Props { collapsed:boolean; onToggle:()=>void; theme:ThemeMode; onThemeToggle:()=>void }
const OWNER_EMAIL='produtosecursosnet@gmail.com'

export function Sidebar({collapsed,onToggle}:Props){
  const location=useLocation()
  const signOut=useAuthStore(s=>s.signOut)
  const user=useAuthStore(s=>s.user)
  const members=useTeamStore(s=>s.members)
  const role=roleForEmail(user?.email,members)
  const permissions=useAuthorizationStore(s=>s.rolePermissions)
  const brand=useWhiteLabelStore((state)=>state.settings)
  const profile=useBusinessProfileStore((state)=>state.profile)
  const favorites=useNavigationPreferencesStore((state)=>state.favorites)
  const recent=useNavigationPreferencesStore((state)=>state.recent)
  const toggleFavorite=useNavigationPreferencesStore((state)=>state.toggleFavorite)
  const recordVisit=useNavigationPreferencesStore((state)=>state.recordVisit)

  const labels:Record<string,string>={
    '/clients':profile.terminology.clients, '/client-360':`${profile.terminology.client} 360º`, '/client-health':`Saúde dos ${profile.terminology.clients.toLowerCase()}`,
    '/sales':`Central de ${profile.terminology.sales}`, '/sales-workspace':`Espaço de ${profile.terminology.sales}`, '/crm':`CRM de ${profile.terminology.clients}`,
    '/contracts':profile.terminology.contract, '/services':`Catálogo de ${profile.terminology.products.toLowerCase()}`, '/proposal-builder':'Propostas'
  }

  const canShow=(item:NavigationItem)=>{
    const module=moduleForPath(item.to)
    if(module&&!profile.enabledModules.includes(module)) return false
    if(item.ownerOnly&&user?.email?.toLowerCase()!==OWNER_EMAIL) return false
    return !item.permission||(permissions[role]||[]).includes(item.permission)
  }

  const groups=useMemo(()=>navigationGroups
    .map(group=>({...group,items:group.items.filter(canShow)}))
    .filter(group=>group.items.length>0),[profile.enabledModules,permissions,role,user?.email])

  const allItems=useMemo(()=>groups.flatMap((group)=>group.items),[groups])
  const itemByPath=useMemo(()=>new Map(allItems.map((item)=>[item.to,item])),[allItems])
  const favoriteItems=favorites.map((path)=>itemByPath.get(path)).filter(Boolean) as NavigationItem[]
  const recentItems=recent.map((entry)=>itemByPath.get(entry.path)).filter(Boolean).slice(0,3) as NavigationItem[]
  const currentItem=allItems.find((item)=>item.to==='/'?location.pathname==='/':location.pathname.startsWith(item.to))
  const activeGroup=groups.find(group=>group.items.some(item=>item.to==='/'?location.pathname==='/':location.pathname.startsWith(item.to)))?.id
  const [expandedGroup,setExpandedGroup]=useState<string|undefined>(()=>localStorage.getItem('amv.sidebar.group')||activeGroup||'principal')

  useEffect(()=>{
    if(activeGroup){ setExpandedGroup(activeGroup); localStorage.setItem('amv.sidebar.group',activeGroup) }
  },[activeGroup])

  useEffect(()=>{
    if(currentItem) recordVisit(currentItem.to,labels[currentItem.to]||currentItem.label)
  },[currentItem?.to])

  const toggleGroup=(id:string)=>{
    if(collapsed) return
    const next=expandedGroup===id?undefined:id
    setExpandedGroup(next)
    if(next) localStorage.setItem('amv.sidebar.group',next); else localStorage.removeItem('amv.sidebar.group')
  }

  return <aside className={`sidebar ${collapsed?'collapsed':''}`}>
    <div className="sidebar-main">
      <div className="brand"><img src={brand.logoUrl||'./icon.png'} className="brand-logo" alt={brand.productName}/>{!collapsed&&<div><strong>{brand.companyName}</strong><span>{brand.productName}</span></div>}</div>
      <nav className="nav" aria-label="Navegação principal">
        {!collapsed&&favoriteItems.length>0&&<NavigationQuickSection title="Favoritos" icon={Star} items={favoriteItems} labels={labels} favorites={favorites} onToggleFavorite={toggleFavorite}/>} 
        {!collapsed&&recentItems.length>0&&<NavigationQuickSection title="Recentes" icon={Clock3} items={recentItems} labels={labels} favorites={favorites} onToggleFavorite={toggleFavorite}/>} 
        {groups.map(group=><NavigationSection key={group.id} group={group} collapsed={collapsed} expanded={expandedGroup===group.id} activeGroup={activeGroup===group.id} labels={labels} favorites={favorites} onToggleFavorite={toggleFavorite} onToggle={()=>toggleGroup(group.id)}/>) }
      </nav>
    </div>
    <div className="sidebar-bottom">
      <Button variant="secondary" className="icon-button" onClick={()=>signOut()}><LogOut size={18}/>{!collapsed&&<span>Sair</span>}</Button>
      <button type="button" className="collapse-button" onClick={onToggle} aria-label={collapsed?'Expandir menu lateral':'Recolher menu lateral'}>{collapsed?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button>
    </div>
  </aside>
}

function NavigationQuickSection({title,icon:Icon,items,labels,favorites,onToggleFavorite}:{title:string;icon:typeof Star;items:NavigationItem[];labels:Record<string,string>;favorites:string[];onToggleFavorite:(path:string)=>void}){
  return <section className="nav-quick-section"><div className="nav-quick-title"><Icon size={14}/><span>{title}</span></div>{items.map((item)=><NavigationLink key={`${title}-${item.to}`} item={item} labels={labels} favorite={favorites.includes(item.to)} onToggleFavorite={onToggleFavorite}/>)}</section>
}

function NavigationSection({group,collapsed,expanded,activeGroup,labels,favorites,onToggleFavorite,onToggle}:{group:NavigationGroup;collapsed:boolean;expanded:boolean;activeGroup:boolean;labels:Record<string,string>;favorites:string[];onToggleFavorite:(path:string)=>void;onToggle:()=>void}){
  const GroupIcon=group.icon
  if(collapsed){
    return <div className="nav-group collapsed-group">
      <button type="button" className={`nav-group-trigger ${activeGroup?'active':''}`} title={group.label} onClick={onToggle}><GroupIcon size={20}/></button>
      <div className="nav-flyout"><strong>{group.label}</strong>{group.items.map(item=><NavigationLink key={item.to} item={item} labels={labels} compact favorite={favorites.includes(item.to)} onToggleFavorite={onToggleFavorite}/>)}</div>
    </div>
  }
  return <div className={`nav-group ${expanded?'expanded':''}`}>
    <button type="button" className={`nav-group-trigger ${activeGroup?'active':''}`} onClick={onToggle} aria-expanded={expanded}><span><GroupIcon size={19}/>{group.label}</span><ChevronDown size={17}/></button>
    {expanded&&<div className="nav-group-items">{group.items.map(item=><NavigationLink key={item.to} item={item} labels={labels} favorite={favorites.includes(item.to)} onToggleFavorite={onToggleFavorite}/>)}</div>}
  </div>
}

function NavigationLink({item,labels,compact=false,favorite,onToggleFavorite}:{item:NavigationItem;labels:Record<string,string>;compact?:boolean;favorite:boolean;onToggleFavorite:(path:string)=>void}){
  const Icon=item.icon
  return <div className="nav-link-row"><NavLink to={item.to} end={item.to==='/'} className={({isActive})=>`nav-item ${item.color||'slate'} ${isActive?'active':''} ${compact?'compact':''}`}><Icon size={18}/><span>{labels[item.to]||item.label}</span></NavLink><button type="button" className={`nav-favorite-button ${favorite?'active':''}`} onClick={()=>onToggleFavorite(item.to)} aria-label={favorite?'Remover dos favoritos':'Adicionar aos favoritos'} title={favorite?'Remover dos favoritos':'Adicionar aos favoritos'}><Star size={14} fill={favorite?'currentColor':'none'}/></button></div>
}
