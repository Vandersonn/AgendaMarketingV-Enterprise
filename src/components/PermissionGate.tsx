import type { ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../lib/authStore'
import { roleForEmail, type Permission } from '../lib/permissions'
import { useAuthorizationStore } from '../lib/authorizationStore'
import { useTeamStore } from '../lib/teamStore'

export function PermissionGate({ permission, children }: { permission: Permission; children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const members = useTeamStore((state) => state.members)
  const permissions = useAuthorizationStore((state) => state.rolePermissions)
  const email = user?.email
  const role = roleForEmail(email, members)

  if (!(permissions[role] || []).includes(permission)) {
    return (
      <div className="page">
        <article className="panel-card access-denied">
          <LockKeyhole size={42} />
          <h1>Acesso restrito</h1>
          <p>Seu perfil não possui permissão para abrir este módulo.</p>
          <span>Perfil atual: {role}</span>
        </article>
      </div>
    )
  }

  return <>{children}</>
}
