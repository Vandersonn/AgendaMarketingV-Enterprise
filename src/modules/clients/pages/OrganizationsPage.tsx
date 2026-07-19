import { useState } from 'react'
import { Building2, CheckCircle2, Plus, Power, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useLicenseStore } from '../../../lib/licenseStore'
import { planHasFeature } from '../../../lib/planFeatures'
import { useOrganizationsStore } from '../../../lib/organizationsStore'

export function OrganizationsPage() {
  const { organizations, currentOrganizationId, addOrganization, setCurrentOrganization, toggleOrganization, removeOrganization } = useOrganizationsStore()
  const license = useLicenseStore((state) => state.license)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', legalName: '', cnpj: '', email: '', phone: '' })
  const canAdd = planHasFeature(license.plan, 'multi_company')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addOrganization(form)
    setOpen(false)
    setForm({ name: '', legalName: '', cnpj: '', email: '', phone: '' })
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">MULTIEMPRESA</span><h1>Empresas e organizações</h1><p>Gerencie empresas, filiais e ambientes operacionais.</p></div>
      <Button onClick={() => setOpen(true)} disabled={!canAdd}><Plus size={18}/> Nova empresa</Button>
    </header>
    {!canAdd && <div className="form-message">O recurso multiempresa exige o plano Enterprise.</div>}
    <section className="organizations-grid">
      {organizations.map((organization) => <article key={organization.id} className={`panel-card organization-card ${currentOrganizationId === organization.id ? 'current' : ''}`}>
        <div className="organization-card-head"><div className="organization-icon"><Building2/></div><div><strong>{organization.name}</strong><span>{organization.legalName}</span></div>{currentOrganizationId === organization.id && <CheckCircle2 className="current-check"/>}</div>
        <div className="organization-data"><span>CNPJ</span><strong>{organization.cnpj}</strong></div>
        <div className="organization-data"><span>E-mail</span><strong>{organization.email}</strong></div>
        <div className="organization-data"><span>Telefone</span><strong>{organization.phone}</strong></div>
        <div className="organization-actions"><Button variant="secondary" onClick={() => setCurrentOrganization(organization.id)} disabled={!organization.active || currentOrganizationId === organization.id}>Selecionar</Button><button type="button" className={`organization-power ${organization.active ? 'active' : ''}`} onClick={() => toggleOrganization(organization.id)}><Power size={17}/></button>{organization.id !== 'devvandersonapps' && <button type="button" className="icon-danger" onClick={() => removeOrganization(organization.id)}><Trash2 size={17}/></button>}</div>
      </article>)}
    </section>
    <Modal title="Nova empresa" open={open} onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label>Nome fantasia<input value={form.name} onChange={(event) => setForm((current) => ({...current,name:event.target.value}))} required/></label>
        <label>Razão social<input value={form.legalName} onChange={(event) => setForm((current) => ({...current,legalName:event.target.value}))} required/></label>
        <label>CNPJ<input value={form.cnpj} onChange={(event) => setForm((current) => ({...current,cnpj:event.target.value}))}/></label>
        <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm((current) => ({...current,email:event.target.value}))}/></label>
        <label className="full">Telefone<input value={form.phone} onChange={(event) => setForm((current) => ({...current,phone:event.target.value}))}/></label>
        <Button className="full">Criar empresa</Button>
      </form>
    </Modal>
  </div>
}
