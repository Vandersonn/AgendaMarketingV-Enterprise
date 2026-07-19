import { useMemo, useState } from 'react'
import { CheckCircle2, PackagePlus, Search, Store, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { marketplaceCatalog, useMarketplaceStore, type MarketplaceCategory } from '../../../lib/marketplaceStore'

const categories:Array<{id:'all'|MarketplaceCategory;label:string}>=[{id:'all',label:'Todos'},{id:'segment',label:'Segmentos'},{id:'productivity',label:'Produtividade'},{id:'integration',label:'Integrações'},{id:'analytics',label:'Analytics'}]
export function MarketplacePage(){
 const{installedIds,install,remove}=useMarketplaceStore();const[query,setQuery]=useState('');const[category,setCategory]=useState<'all'|MarketplaceCategory>('all')
 const items=useMemo(()=>marketplaceCatalog.filter((item)=>(category==='all'||item.category===category)&&`${item.name} ${item.description} ${item.industry}`.toLowerCase().includes(query.toLowerCase())),[query,category])
 return <div className="page"><header className="page-header"><div><span className="eyebrow">PLATAFORMA CENTRAL RC15</span><h1>Loja de módulos</h1><p>Instale capacidades por segmento sem alterar o núcleo da plataforma.</p></div><div className="marketplace-installed"><Store size={20}/><strong>{installedIds.length}</strong><span>instalados</span></div></header>
 <div className="marketplace-toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar módulos..."/></div><div className="choice-row">{categories.map((item)=><button type="button" key={item.id} className={category===item.id?'choice active':'choice'} onClick={()=>setCategory(item.id)}>{item.label}</button>)}</div></div>
 <section className="marketplace-grid">{items.map((item)=>{const installed=installedIds.includes(item.id);return <article className="panel-card marketplace-card" key={item.id}><div className="marketplace-card-head"><span>{item.industry}</span><b>{item.plan}</b></div><h2>{item.name}</h2><p>{item.description}</p><div className="marketplace-features">{item.features.map((feature)=><span key={feature}><CheckCircle2 size={14}/>{feature}</span>)}</div><div className="marketplace-card-footer"><small>v{item.version}</small>{installed?<Button variant="secondary" onClick={()=>remove(item.id)}><Trash2 size={16}/> Remover</Button>:<Button onClick={()=>install(item)}><PackagePlus size={16}/> Instalar</Button>}</div></article>})}</section></div>
}
