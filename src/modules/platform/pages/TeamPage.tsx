import { useState } from 'react'
import { Plus, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useTeamStore, type TeamRole } from '../../../lib/teamStore'

const roles: Record<TeamRole, string> = {
  owner: 'Proprietário', admin: 'Administrador', sales: 'Comercial',
  marketing: 'Marketing', finance: 'Financeiro', viewer: 'Somente leitura'
}

export function TeamPage() {
  const { members, addMember, removeMember, toggleActive } = useTeamStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' as TeamRole, active: true })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addMember(form)
    setOpen(false)
    setForm({ name: '', email: '', role: 'viewer', active: true })
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">EQUIPE E PERMISSÕES</span><h1>Usuários da empresa</h1><p>Organize perfis, funções e acessos.</p></div>
      <Button onClick={() => setOpen(true)}><Plus size={18}/> Novo usuário</Button>
    </header>
    <section className="team-grid">
      {members.map((member) => <article key={member.id} className="panel-card team-card">
        <div className="team-avatar">{member.name.split(' ').map((p) => p[0]).slice(0,2).join('').toUpperCase()}</div>
        <div className="team-info"><strong>{member.name}</strong><span>{member.email}</span><em><ShieldCheck size={14}/>{roles[member.role]}</em></div>
        <span className={`member-status ${member.active ? 'active' : 'inactive'}`}>{member.active ? 'Ativo' : 'Inativo'}</span>
        <div className="team-actions">
          <button type="button" onClick={() => toggleActive(member.id)} title="Ativar ou desativar">{member.active ? <UserX size={17}/> : <UserCheck size={17}/>}</button>
          {member.role !== 'owner' && <button type="button" className="icon-danger" onClick={() => removeMember(member.id)}><Trash2 size={17}/></button>}
        </div>
      </article>)}
    </section>
    <Modal title="Novo usuário" open={open} onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label>Nome<input value={form.name} onChange={(e) => setForm((current) => ({...current,name:e.target.value}))} required/></label>
        <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm((current) => ({...current,email:e.target.value}))} required/></label>
        <label className="full">Perfil<select value={form.role} onChange={(e) => setForm((current) => ({...current,role:e.target.value as TeamRole}))}>{Object.entries(roles).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <Button className="full">Adicionar usuário</Button>
      </form>
    </Modal>
  </div>
}
