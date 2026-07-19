import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Rocket, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'
import { industryOptions, moduleOptions, useBusinessProfileStore, type BusinessModel } from '../lib/businessProfileStore'

export function Onboarding() {
  const {profile,toggleIndustry,updateProfile,toggleModule,completeConfiguration}=useBusinessProfileStore()
  const [open,setOpen]=useState(()=>!profile.configured)
  const [step,setStep]=useState(0)
  function finish(){ completeConfiguration(); setOpen(false) }
  if(!open)return null
  return <div className="onboarding-backdrop"><div className="onboarding-card business-onboarding">
    <button type="button" className="onboarding-close" onClick={finish} aria-label="Fechar configuração inicial"><X/></button>
    <div className="onboarding-progress">{[0,1,2].map((index)=><span key={index} className={index<=step?'active':''}/>)}</div>
    <div className="onboarding-icon">{step===0?<Building2 size={34}/>:<Rocket size={34}/>}</div>
    <span className="eyebrow">CONFIGURAÇÃO {step+1} DE 3</span>
    {step===0&&<><h1>Quais são os tipos do seu negócio?</h1><p>Escolha até 5 segmentos. O sistema combina automaticamente os módulos necessários.</p><div className="industry-selection-summary"><strong>Tipos selecionados</strong><span>{profile.selectedIndustries.length}/5</span></div><div className="industry-grid compact">{industryOptions.map((item)=>{const active=profile.selectedIndustries.includes(item.id);const blocked=!active&&profile.selectedIndustries.length>=5;return <button type="button" key={item.id} disabled={blocked} className={`industry-option ${active?'active':''} ${blocked?'disabled':''}`} onClick={()=>toggleIndustry(item.id)}><strong>{item.label}</strong><span>{item.description}</span></button>})}</div></>}
    {step===1&&<><h1>Conte um pouco sobre a empresa</h1><p>Esses dados personalizam sua operação.</p><div className="form-grid onboarding-form"><label>Nome da empresa<input value={profile.companyName} onChange={(e)=>updateProfile({companyName:e.target.value})}/></label><label>Especialidade<input value={profile.specialty} onChange={(e)=>updateProfile({specialty:e.target.value})}/></label><label>Modelo<select value={profile.businessModel} onChange={(e)=>updateProfile({businessModel:e.target.value as BusinessModel})}><option value="services">Serviços</option><option value="products">Produtos</option><option value="courses">Cursos</option><option value="subscriptions">Assinaturas</option><option value="mixed">Misto</option></select></label><label>Público-alvo<input value={profile.targetAudience} onChange={(e)=>updateProfile({targetAudience:e.target.value})}/></label></div></>}
    {step===2&&<><h1>Escolha os módulos ativos</h1><p>Você poderá alterar essa seleção nas configurações.</p><div className="module-toggle-list onboarding-modules">{moduleOptions.map((item)=><label key={item.id} className="module-toggle"><input type="checkbox" checked={profile.enabledModules.includes(item.id)} onChange={()=>toggleModule(item.id)}/><CheckCircle2 size={17}/><span>{item.label}</span></label>)}</div></>}
    <div className="onboarding-actions"><Button variant="secondary" disabled={step===0} onClick={()=>setStep((v)=>v-1)}><ChevronLeft size={17}/> Voltar</Button>{step<2?<Button onClick={()=>setStep((v)=>v+1)}>Continuar <ChevronRight size={17}/></Button>:<Button onClick={finish}>Aplicar configuração</Button>}</div>
  </div></div>
}
