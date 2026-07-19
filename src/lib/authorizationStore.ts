import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import type { Permission } from './permissions'
import type { TeamRole } from './teamStore'
import { rolePermissions as defaults } from './permissions'

export interface SecurityPolicy {
  sessionMinutes: number
  maxFailedAttempts: number
  requireStrongPassword: boolean
  auditExports: boolean
}

interface AuthorizationState {
  rolePermissions: Record<TeamRole, Permission[]>
  policy: SecurityPolicy
  togglePermission: (role: TeamRole, permission: Permission) => void
  updatePolicy: (patch: Partial<SecurityPolicy>) => void
  resetDefaults: () => void
}

const savedPermissions = loadLocal<Record<TeamRole, Permission[]>>('rbac_permissions', defaults)
const savedPolicy = loadLocal<SecurityPolicy>('security_policy', {
  sessionMinutes: 480,
  maxFailedAttempts: 5,
  requireStrongPassword: true,
  auditExports: true
})

function persistPermissions(value: Record<TeamRole, Permission[]>) { saveLocal('rbac_permissions', value) }

export const useAuthorizationStore = create<AuthorizationState>((set) => ({
  rolePermissions: savedPermissions,
  policy: savedPolicy,
  togglePermission: (role, permission) => set((state) => {
    if (role === 'owner') return state
    const current = state.rolePermissions[role] || []
    const nextRole = current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    const rolePermissions = { ...state.rolePermissions, [role]: nextRole }
    persistPermissions(rolePermissions)
    return { rolePermissions }
  }),
  updatePolicy: (patch) => set((state) => {
    const policy = { ...state.policy, ...patch }
    saveLocal('security_policy', policy)
    return { policy }
  }),
  resetDefaults: () => {
    persistPermissions(defaults)
    set({ rolePermissions: defaults })
  }
}))
