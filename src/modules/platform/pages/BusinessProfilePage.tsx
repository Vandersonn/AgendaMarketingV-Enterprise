import { Building2, Check, CheckCircle2, SlidersHorizontal, Tags } from 'lucide-react'
import { Button } from '../../../components/Button'
import { industryOptions, moduleOptions, useBusinessProfileStore, type BusinessModel } from '../../../lib/businessProfileStore'
import { useState } from 'react'

const channels = ['WhatsApp','Instagram','Facebook','Site','E-mail','Telefone','Presencial','Marketplace']

export function BusinessProfilePage(){
  const {profile,toggleIndustry,updateProfile,updateTerminology,toggleModule,completeConfiguration}=useBusinessProfileStore()
  const [message,setMessage]=useState('')
  function toggleChannel(channel:string){
    updateProfile({salesChannels:profile.salesChannels.includes(channel)?profile.salesChannels.filter((item)=>item!==channel):[...profile.salesChannels,channel]})
  }
  function save(){ completeConfiguration(); setMessage(`Perfil salvo com ${profile.selectedIndustries.length} tipo(s) de negócio ativo(s).`) }
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">PERSONALIZAÇÃO MULTISSETORIAL</span><h1>Perfil do negócio</h1><p>Adapte módulos, termos e experiência ao ramo de atuação do licenciado.</p></div><Button onClick={save}><Check size={17}/> Salvar perfil</Button></header>
    {message&&<div className="form-message success">{message}</div>}
    <section className="business-profile-grid">
      <article className="panel-card full-span"><div className="panel-header"><div><h2><Building2 size={20}/> Identidade e ramo</h2><p>Escolha um modelo pronto ou configure livremente.</p></div></div>
        <div className="industry-selection-summary"><strong>Selecione até 5 tipos de negócio</strong><span>{profile.selectedIndustries.length}/5 selecionados</span></div><div className="industry-grid">{industryOptions.map((item)=>{const active=profile.selectedIndustries.includes(item.id);const blocked=!active&&profile.selectedIndustries.length>=5;return <button type="button" key={item.id} disabled={blocked} className={`industry-option ${active?'active':''} ${blocked?'disabled':''}`} onClick={()=>toggleIndustry(item.id)}><div className="industry-option-title"><strong>{item.label}</strong>{active&&<CheckCircle2 size={18}/>}</div><span>{item.description}</span></button>})}</div>
        <div className="form-grid profile-form">
          <label>Nome da empresa<input value={profile.companyName} onChange={(e)=>updateProfile({companyName:e.target.value})}/></label>
          <label>Especialidade<input value={profile.specialty} onChange={(e)=>updateProfile({specialty:e.target.value})} placeholder="Ex.: cursos profissionalizantes"/></label>
          {profile.selectedIndustries.includes('custom')&&<label>Ramo personalizado<input value={profile.customIndustry} onChange={(e)=>updateProfile({customIndustry:e.target.value})}/></label>}
          <label>Modelo de negócio<select value={profile.businessModel} onChange={(e)=>updateProfile({businessModel:e.target.value as BusinessModel})}><option value="services">Serviços</option><option value="products">Produtos</option><option value="courses">Cursos</option><option value="subscriptions">Assinaturas</option><option value="mixed">Misto</option></select></label>
          <label>Público-alvo<input value={profile.targetAudience} onChange={(e)=>updateProfile({targetAudience:e.target.value})}/></label>
          <label>Região atendida<input value={profile.location} onChange={(e)=>updateProfile({location:e.target.value})}/></label>
        </div>
        <div className="choice-row">{channels.map((channel)=><button type="button" key={channel} className={profile.salesChannels.includes(channel)?'choice active':'choice'} onClick={()=>toggleChannel(channel)}>{channel}</button>)}</div>
      </article>
      <article className="panel-card"><div className="panel-header"><div><h2><SlidersHorizontal size={20}/> Módulos ativos</h2><p>Itens desativados deixam de aparecer no menu.</p></div></div><div className="module-toggle-list">{moduleOptions.map((item)=><label key={item.id} className="module-toggle"><input type="checkbox" checked={profile.enabledModules.includes(item.id)} onChange={()=>toggleModule(item.id)}/><span>{item.label}</span></label>)}</div></article>
      <article className="panel-card"><div className="panel-header"><div><h2><Tags size={20}/> Nomenclaturas</h2><p>Personalize os nomes sem alterar a estrutura interna.</p></div></div><div className="form-grid terminology-grid">
        <label>Cliente<input value={profile.terminology.client} onChange={(e)=>updateTerminology({client:e.target.value})}/></label><label>Clientes<input value={profile.terminology.clients} onChange={(e)=>updateTerminology({clients:e.target.value})}/></label>
        <label>Produto<input value={profile.terminology.product} onChange={(e)=>updateTerminology({product:e.target.value})}/></label><label>Produtos<input value={profile.terminology.products} onChange={(e)=>updateTerminology({products:e.target.value})}/></label>
        <label>Venda<input value={profile.terminology.sale} onChange={(e)=>updateTerminology({sale:e.target.value})}/></label><label>Vendas<input value={profile.terminology.sales} onChange={(e)=>updateTerminology({sales:e.target.value})}/></label>
        <label>Oportunidade<input value={profile.terminology.opportunity} onChange={(e)=>updateTerminology({opportunity:e.target.value})}/></label><label>Oportunidades<input value={profile.terminology.opportunities} onChange={(e)=>updateTerminology({opportunities:e.target.value})}/></label>
        <label>Responsável comercial<input value={profile.terminology.seller} onChange={(e)=>updateTerminology({seller:e.target.value})}/></label><label>Contrato<input value={profile.terminology.contract} onChange={(e)=>updateTerminology({contract:e.target.value})}/></label>
      </div></article>
    </section>
  </div>
}
