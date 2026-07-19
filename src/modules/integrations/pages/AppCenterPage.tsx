import { useMemo, useState } from 'react'
import {
  Activity, BrainCircuit, BriefcaseBusiness, Cable, ContactRound,
  Headphones, LayoutDashboard, LayoutGrid, Megaphone, Power,
  Search, Trash2, WalletCards
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { usePluginRegistryStore, type AppPlugin } from '../../../lib/pluginRegistryStore'

const iconMap: Record<string, typeof Activity> = {
  Activity, BrainCircuit, BriefcaseBusiness, Cable, ContactRound,
  Headphones, LayoutDashboard, LayoutGrid, Megaphone, WalletCards
}

const categoryLabels: Record<AppPlugin['category'],string> = {
  core:'Núcleo',
  business:'Gestão',
  marketing:'Marketing',
  analytics:'Inteligência',
  integration:'Integrações',
  system:'Sistema'
}

export function AppCenterPage(){
  const navigate=useNavigate()
  const {plugins,toggle,uninstall,reset}=usePluginRegistryStore()
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState<'all'|AppPlugin['category']>('all')

  const filtered=useMemo(()=>plugins
    .filter((item)=>category==='all'||item.category===category)
    .filter((item)=>`${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b)=>a.name.localeCompare(b.name)),[plugins,query,category])

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">ORION APP CENTER</span><h1>Aplicativos e plugins</h1><p>Abra, ative, desative e organize os recursos da plataforma.</p></div>
      <Button variant="secondary" onClick={reset}>Restaurar plugins</Button>
    </header>

    <div className="app-center-toolbar">
      <div className="search-box"><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar aplicativo..."/></div>
      <select value={category} onChange={(event)=>setCategory(event.target.value as typeof category)}>
        <option value="all">Todas as categorias</option>
        {Object.entries(categoryLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
      </select>
    </div>

    <section className="app-center-grid">
      {filtered.map((plugin)=>{
        const Icon=iconMap[plugin.icon]||Activity
        return <article key={plugin.id} className={`panel-card app-center-card status-${plugin.status}`}>
          <div className="app-center-card-head">
            <div className="app-center-icon"><Icon/></div>
            <span>{categoryLabels[plugin.category]}</span>
          </div>
          <h2>{plugin.name}</h2>
          <p>{plugin.description}</p>
          <div className="app-center-meta"><span>v{plugin.version}</span><span>Plano {plugin.requiredPlan}</span></div>
          <div className="app-center-actions">
            <Button onClick={()=>navigate(plugin.route)} disabled={plugin.status!=='active'}>Abrir</Button>
            <button type="button" className={`plugin-power ${plugin.status==='active'?'active':''}`} onClick={()=>toggle(plugin.id)} title="Ativar ou desativar"><Power size={17}/></button>
            {!['dashboard','crm','health'].includes(plugin.id)&&<button type="button" className="icon-danger" onClick={()=>uninstall(plugin.id)} title="Desinstalar"><Trash2 size={17}/></button>}
          </div>
        </article>
      })}
      {!filtered.length&&<article className="panel-card empty-panel"><strong>Nenhum aplicativo encontrado</strong></article>}
    </section>
  </div>
}
