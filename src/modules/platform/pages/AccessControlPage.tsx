import { RotateCcw, ShieldCheck, Timer, UserCog } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAuthorizationStore } from '../../../lib/authorizationStore'
import type { Permission } from '../../../lib/permissions'
import type { TeamRole } from '../../../lib/teamStore'

const roles: Array<{ key: TeamRole; label: string }> = [
  { key: 'owner', label: 'Proprietário' }, { key: 'admin', label: 'Administrador' },
  { key: 'sales', label: 'Comercial' }, { key: 'marketing', label: 'Marketing' },
  { key: 'finance', label: 'Financeiro' }, { key: 'viewer', label: 'Leitura' }
]
const permissions: Array<{ key: Permission; label: string; group: string }> = [
  { key:'dashboard.view',label:'Visualizar dashboard',group:'Geral' },
  { key:'crm.view',label:'Visualizar CRM',group:'CRM' }, { key:'crm.edit',label:'Editar CRM',group:'CRM' },
  { key:'clients.view',label:'Visualizar clientes',group:'Clientes' }, { key:'clients.edit',label:'Editar clientes',group:'Clientes' },
  { key:'marketing.view',label:'Visualizar marketing',group:'Marketing' }, { key:'marketing.edit',label:'Editar marketing',group:'Marketing' },
  { key:'finance.view',label:'Visualizar financeiro',group:'Financeiro' }, { key:'finance.edit',label:'Editar financeiro',group:'Financeiro' },
  { key:'reports.view',label:'Visualizar relatórios',group:'Geral' }, { key:'tasks.view',label:'Visualizar tarefas',group:'Operação' },
  { key:'tasks.edit',label:'Editar tarefas',group:'Operação' }, { key:'team.manage',label:'Gerenciar equipe',group:'Administração' },
  { key:'integrations.manage',label:'Gerenciar integrações',group:'Administração' }, { key:'audit.view',label:'Visualizar auditoria',group:'Administração' },
  { key:'settings.manage',label:'Administrar plataforma',group:'Administração' }
]

export function AccessControlPage(){
  const { rolePermissions, policy, togglePermission, updatePolicy, resetDefaults } = useAuthorizationStore()
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CORE 16.1 • SEGURANÇA ENTERPRISE</span><h1>Controle de acesso</h1><p>RBAC centralizado, políticas de sessão e permissões por função.</p></div><Button variant="secondary" onClick={resetDefaults}><RotateCcw size={17}/> Restaurar padrão</Button></header>
    <section className="metric-grid compact"><article className="metric-card"><ShieldCheck/><span>Papéis protegidos</span><strong>{roles.length}</strong></article><article className="metric-card"><UserCog/><span>Permissões registradas</span><strong>{permissions.length}</strong></article><article className="metric-card"><Timer/><span>Sessão</span><strong>{policy.sessionMinutes} min</strong></article></section>
    <section className="panel-card security-policy"><h2>Políticas de segurança</h2><div className="form-grid">
      <label>Duração da sessão (min)<input type="number" min="15" value={policy.sessionMinutes} onChange={(e)=>updatePolicy({sessionMinutes:Number(e.target.value)})}/></label>
      <label>Tentativas antes do bloqueio<input type="number" min="3" value={policy.maxFailedAttempts} onChange={(e)=>updatePolicy({maxFailedAttempts:Number(e.target.value)})}/></label>
      <label className="check-line"><input type="checkbox" checked={policy.requireStrongPassword} onChange={(e)=>updatePolicy({requireStrongPassword:e.target.checked})}/> Exigir senha forte</label>
      <label className="check-line"><input type="checkbox" checked={policy.auditExports} onChange={(e)=>updatePolicy({auditExports:e.target.checked})}/> Auditar exportações</label>
    </div></section>
    <section className="panel-card"><div className="section-title"><div><h2>Matriz de permissões</h2><p>O proprietário mantém acesso total e não pode ser restringido.</p></div></div>
      <div className="permission-matrix"><table><thead><tr><th>Permissão</th>{roles.map((role)=><th key={role.key}>{role.label}</th>)}</tr></thead><tbody>{permissions.map((permission)=><tr key={permission.key}><td><strong>{permission.label}</strong><span>{permission.group}</span></td>{roles.map((role)=><td key={role.key}><input aria-label={`${permission.label} - ${role.label}`} type="checkbox" disabled={role.key==='owner'} checked={(rolePermissions[role.key]||[]).includes(permission.key)} onChange={()=>togglePermission(role.key,permission.key)}/></td>)}</tr>)}</tbody></table></div>
    </section>
  </div>
}
