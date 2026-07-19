import { useState } from 'react'
import { BellRing, Boxes, Building2, CheckCircle2, Network, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '../../../components/Button'
import { usePlatformCoreStore } from '../../../lib/platformCoreStore'

export function PlatformCorePage(){
 const {modules,tenants,activeTenantId,notifications,toggleModule,setActiveTenant,addTenant,markRead,publishHealthCheck}=usePlatformCoreStore()
 const [name,setName]=useState(''); const [document,setDocument]=useState('')
 const active=tenants.find(t=>t.id===activeTenantId)
 return <div className="page platform-core-page">
  <header className="page-header"><div><span className="eyebrow">AGENDA PLATFORM 16</span><h1>Platform Core</h1><p>Fundação modular, multiempresa, orientada a eventos e pronta para integrações.</p></div><Button onClick={publishHealthCheck}><CheckCircle2 size={17}/> Verificar plataforma</Button></header>
  <section className="crm-summary">
   <article className="panel-card compact-card"><span>Módulos ativos</span><strong>{modules.filter(m=>m.enabled).length}</strong></article>
   <article className="panel-card compact-card"><span>Empresas</span><strong>{tenants.length}</strong></article>
   <article className="panel-card compact-card"><span>Empresa atual</span><strong>{active?.name}</strong></article>
   <article className="panel-card compact-card"><span>Alertas não lidos</span><strong>{notifications.filter(n=>!n.read).length}</strong></article>
  </section>
  <section className="platform-grid">
   <article className="panel-card"><div className="panel-header"><div><h2><Boxes size={20}/> Registro de módulos</h2><p>Ative recursos sem alterar o núcleo da aplicação.</p></div></div><div className="module-registry">{modules.map(m=><div className="module-row" key={m.id}><div><strong>{m.name}</strong><span>{m.category} • v{m.version}</span><p>{m.description}</p><small>Dependências: {m.dependencies.join(', ')||'nenhuma'}</small></div><label className="switch"><input type="checkbox" checked={m.enabled} disabled={m.id==='core'} onChange={()=>toggleModule(m.id)}/><span/></label></div>)}</div></article>
   <div className="platform-stack">
    <article className="panel-card"><div className="panel-header"><div><h2><Building2 size={20}/> Contexto multiempresa</h2><p>Troque a empresa ativa sem misturar operações.</p></div></div><div className="tenant-list">{tenants.map(t=><button type="button" className={t.id===activeTenantId?'active':''} key={t.id} onClick={()=>setActiveTenant(t.id)}><span style={{background:t.color}}/><div><strong>{t.name}</strong><small>{t.document}</small></div>{t.id===activeTenantId&&<CheckCircle2 size={18}/>}</button>)}</div><div className="tenant-form"><input placeholder="Nome da empresa" value={name} onChange={e=>setName(e.target.value)}/><input placeholder="CNPJ/Documento" value={document} onChange={e=>setDocument(e.target.value)}/><Button variant="secondary" onClick={()=>{if(name.trim()){addTenant(name.trim(),document.trim()||'Não informado');setName('');setDocument('')}}}><Plus size={16}/> Adicionar</Button></div></article>
    <article className="panel-card platform-capabilities"><h2><Network size={20}/> Arquitetura RC16</h2><div><span><ShieldCheck/>Permissões centralizadas</span><span><Network/>Barramento interno de eventos</span><span><BellRing/>Notificações persistentes</span><span><Boxes/>Módulos desacoplados</span></div></article>
   </div>
  </section>
  <article className="panel-card"><div className="panel-header"><div><h2><BellRing size={20}/> Notificações da plataforma</h2><p>Mensagens geradas pelo núcleo e pelas extensões.</p></div></div><div className="platform-notifications">{notifications.slice(0,8).map(n=><button type="button" key={n.id} className={n.read?'read':''} onClick={()=>markRead(n.id)}><strong>{n.title}</strong><span>{n.message}</span><small>{new Date(n.createdAt).toLocaleString('pt-BR')}</small></button>)}{!notifications.length&&<div className="empty-inline">Nenhuma notificação da plataforma.</div>}</div></article>
 </div>
}
