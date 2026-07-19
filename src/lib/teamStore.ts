import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

export type TeamRole = 'owner' | 'admin' | 'sales' | 'marketing' | 'finance' | 'viewer'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  active: boolean
  createdAt: string
}

interface TeamState {
  members: TeamMember[]
  addMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void
  updateMember: (member: TeamMember) => void
  removeMember: (id: string) => void
  toggleActive: (id: string) => void
}

const initial: TeamMember[] = loadLocal('team_members', [{
  id: 'owner',
  name: 'Vanderson de Castro',
  email: 'produtosecursosnet@gmail.com',
  role: 'owner',
  active: true,
  createdAt: new Date().toISOString()
}])

function persist(members: TeamMember[]) {
  saveLocal('team_members', members)
}

export const useTeamStore = create<TeamState>((set) => ({
  members: initial,
  addMember: (data) => set((state) => {
    const member = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const members = [...state.members, member]
    persist(members)
    useAuditStore.getState().log({
      action: 'create',
      module: 'Equipe',
      description: `Usuário ${member.name} adicionado com perfil ${member.role}.`,
      user: 'Vanderson de Castro'
    })
    return { members }
  }),
  updateMember: (member) => set((state) => {
    const members = state.members.map((item) => item.id === member.id ? member : item)
    persist(members)
    return { members }
  }),
  removeMember: (id) => set((state) => {
    const target = state.members.find((item) => item.id === id)
    const members = state.members.filter((item) => item.id !== id)
    persist(members)
    if (target) useAuditStore.getState().log({
      action: 'delete',
      module: 'Equipe',
      description: `Usuário ${target.name} removido.`,
      user: 'Vanderson de Castro'
    })
    return { members }
  }),
  toggleActive: (id) => set((state) => {
    const members = state.members.map((item) => item.id === id ? { ...item, active: !item.active } : item)
    persist(members)
    return { members }
  })
}))
