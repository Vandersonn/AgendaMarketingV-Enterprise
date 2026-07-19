import { useState } from 'react'
import { PackageCheck, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useServiceCatalogStore, type ServiceItem } from '../../../lib/serviceCatalogStore'

const billingLabels: Record<ServiceItem['billing'],string>={one_time:'Pagamento único',monthly:'Mensal',yearly:'Anual'}

export function ServiceCatalogPage(){
  const{services,addService,toggleActive,removeService}=useServiceCatalogStore()
  const[open,setOpen]=useState(false)
  const[form,setForm]=useState({name:'',category:'Marketing',description:'',price:0,billing:'monthly' as ServiceItem['billing'],active:true,estimatedDays:30})
  function submit(event:React.FormEvent){event.preventDefault();addService(form);setOpen(false)}
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CATÁLOGO COMERCIAL</span><h1>Serviços e pacotes</h1><p>Padronize ofertas, preços, prazos e recorrência.</p></div><Button onClick={()=>setOpen(true)}><Plus size={18}/> Novo serviço</Button></header>
    <section className="service-grid">
      {services.map((service)=><article key={service.id} className={`panel-card service-card ${service.active?'':'inactive'}`}>
        <div className="service-card-head"><div className="service-icon"><PackageCheck/></div><button type="button" className="icon-danger" onClick={()=>removeService(service.id)}><Trash2 size={17}/></button></div>
        <span>{service.category}</span><h2>{service.name}</h2><p>{service.description}</p>
        <strong>{service.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong>
        <div className="service-meta"><span>{billingLabels[service.billing]}</span><span>{service.estimatedDays} dias</span></div>
        <button type="button" className={`service-status ${service.active?'active':''}`} onClick={()=>toggleActive(service.id)}>{service.active?'Ativo':'Inativo'}</button>
      </article>)}
    </section>
    <Modal title="Novo serviço" open={open} onClose={()=>setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Nome<input value={form.name} onChange={(event)=>setForm((current) => ({...current,name:event.target.value}))} required/></label>
        <label>Categoria<input value={form.category} onChange={(event)=>setForm((current) => ({...current,category:event.target.value}))}/></label>
        <label>Preço<input type="number" step="0.01" value={form.price} onChange={(event)=>setForm((current) => ({...current,price:Number(event.target.value)}))}/></label>
        <label>Cobrança<select value={form.billing} onChange={(event)=>setForm((current) => ({...current,billing:event.target.value as ServiceItem['billing']}))}>{Object.entries(billingLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>Prazo estimado<input type="number" value={form.estimatedDays} onChange={(event)=>setForm((current) => ({...current,estimatedDays:Number(event.target.value)}))}/></label>
        <label className="full">Descrição<textarea value={form.description} onChange={(event)=>setForm((current) => ({...current,description:event.target.value}))}/></label>
        <Button className="full">Salvar serviço</Button>
      </form>
    </Modal>
  </div>
}
