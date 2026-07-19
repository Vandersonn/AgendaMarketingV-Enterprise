import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface Organization {
  id: string
  name: string
  legalName: string
  cnpj: string
  email: string
  phone: string
  active: boolean
  createdAt: string
}

interface OrganizationState {
  organizations: Organization[]
  currentOrganizationId: string
  addOrganization: (organization: Omit<Organization, 'id' | 'createdAt' | 'active'>) => void
  setCurrentOrganization: (id: string) => void
  toggleOrganization: (id: string) => void
  removeOrganization: (id: string) => void
}

const defaultOrganization: Organization = {
  id: 'devvandersonapps',
  name: 'DEVVANDERSONAPPS',
  legalName: 'Vanderson de Castro',
  cnpj: '39.551.372/0001-41',
  email: 'produtosecursosnet@gmail.com',
  phone: '31 98932-0563',
  active: true,
  createdAt: new Date().toISOString()
}

const saved = loadLocal<{ organizations: Organization[]; currentOrganizationId: string }>(
  'organizations',
  { organizations: [defaultOrganization], currentOrganizationId: defaultOrganization.id }
)

function persist(organizations: Organization[], currentOrganizationId: string) {
  saveLocal('organizations', { organizations, currentOrganizationId })
}

export const useOrganizationsStore = create<OrganizationState>((set) => ({
  organizations: Array.isArray(saved.organizations) && saved.organizations.length ? saved.organizations : [defaultOrganization],
  currentOrganizationId: saved.currentOrganizationId || defaultOrganization.id,

  addOrganization: (data) => set((state) => {
    const organization: Organization = {
      ...data,
      id: crypto.randomUUID(),
      active: true,
      createdAt: new Date().toISOString()
    }
    const organizations = [...state.organizations, organization]
    persist(organizations, organization.id)
    return { organizations, currentOrganizationId: organization.id }
  }),

  setCurrentOrganization: (id) => set((state) => {
    const exists = state.organizations.some((item) => item.id === id && item.active)
    if (!exists) return state
    persist(state.organizations, id)
    return { currentOrganizationId: id }
  }),

  toggleOrganization: (id) => set((state) => {
    const organizations = state.organizations.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    )
    let currentOrganizationId = state.currentOrganizationId
    const current = organizations.find((item) => item.id === currentOrganizationId)
    if (!current?.active) currentOrganizationId = organizations.find((item) => item.active)?.id ?? ''
    persist(organizations, currentOrganizationId)
    return { organizations, currentOrganizationId }
  }),

  removeOrganization: (id) => set((state) => {
    if (id === 'devvandersonapps') return state
    const organizations = state.organizations.filter((item) => item.id !== id)
    const currentOrganizationId = state.currentOrganizationId === id
      ? organizations.find((item) => item.active)?.id ?? 'devvandersonapps'
      : state.currentOrganizationId
    persist(organizations, currentOrganizationId)
    return { organizations, currentOrganizationId }
  })
}))
