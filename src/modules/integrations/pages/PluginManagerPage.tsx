import { useMemo, useState } from 'react'
import { CheckCircle2, PackageCheck, RefreshCw, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { usePluginRegistryStore } from '../../../lib/pluginRegistryStore'
import { validatePlugin } from '../../../lib/pluginValidation'

export function PluginManagerPage(){
  const{plugins,toggle,uninstall,reset}=usePluginRegistryStore()
  const[query,setQuery]=useState('')
  const validations=useMemo(()=>new Map(plugins.map((item)=>[item.id,validatePlugin(item)])),[plugins])
  const filtered=plugins.filter((item)=>`${item.name} ${item.id} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
  const validCount=[...validations.values()].filter((item)=>item.valid).length

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">MECANISMO DE EXTENSÕES</span><h1>Gerenciador de Extensões 2.0</h1><p>Validação de manifesto, compatibilidade, integridade e estado dos módulos.</p></div><Button variant="secondary" onClick={reset}><RefreshCw size={17}/> Restaurar registro</Button></header>
    <section className="plugin-quality-hero panel-card"><PackageCheck/><div><span>Plugins válidos</span><strong>{validCount}/{plugins.length}</strong></div><div><span>Ativos</span><strong>{plugins.filter((item)=>item.status==='active').length}</strong></div><div><span>Com erro</span><strong>{plugins.filter((item)=>item.status==='error').length}</strong></div></section>
    <div className="search-box"><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar plugin..."/></div>
    <section className="plugin-manager-list">{filtered.map((plugin)=>{
      const validation=validations.get(plugin.id)!
      return <article key={plugin.id} className={`panel-card plugin-manager-card status-${plugin.status}`}><div className="plugin-manager-head">{validation.valid?<CheckCircle2/>:<ShieldAlert/>}<div><span>{plugin.category} • plano {plugin.requiredPlan}</span><h2>{plugin.name}</h2><p>{plugin.description}</p></div><strong className="plugin-score">{validation.score}</strong></div><div className="plugin-details"><span>ID: {plugin.id}</span><span>Versão: {plugin.version}</span><span>Rota: {plugin.route}</span><span>Atualizado: {new Date(plugin.updatedAt).toLocaleDateString('pt-BR')}</span></div>{validation.issues.length>0&&<div className="plugin-issues">{validation.issues.map((issue)=><span key={issue}>{issue}</span>)}</div>}<div className="plugin-manager-actions"><Button variant="secondary" onClick={()=>toggle(plugin.id)}>{plugin.status==='active'?'Desativar':'Ativar'}</Button>{!['dashboard','crm','health'].includes(plugin.id)&&<button type="button" className="icon-danger" onClick={()=>uninstall(plugin.id)}><Trash2 size={17}/></button>}</div></article>})}</section>
  </div>
}
