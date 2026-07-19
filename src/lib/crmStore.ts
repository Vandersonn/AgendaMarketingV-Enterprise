import { create } from 'zustand'
import { DataService } from '../data/DataService.ts'
import type { CrmData } from '../data/repositories/CrmRepository'
import type { Activity, Client, Lead, LeadStage, Proposal } from './crmTypes'
import { trashRecord } from './trashStore'

interface CrmState {
  clients: Client[]
  leads: Lead[]
  activities: Activity[]
  proposals: Proposal[]
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (client: Client) => void
  deleteClient: (id: string) => void
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void
  importLeads: (leads: Array<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) => number
  updateLead: (lead: Lead) => void
  moveLead: (id: string, stage: LeadStage) => void
  deleteLead: (id: string) => void
  addActivity: (activity: Omit<Activity, 'id'>) => void
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt'>) => void
  updateProposal: (proposal: Proposal) => void
}

const defaultClients: Client[] = [
  {
    id: 'client_demo_1',
    name: 'Mariana Souza',
    company: 'Clínica Vital',
    email: 'mariana@clinicavital.com',
    phone: '(31) 99999-1111',
    city: 'Belo Horizonte',
    state: 'MG',
    document: '',
    notes: 'Cliente interessada em gestão de redes sociais.',
    createdAt: new Date().toISOString()
  }
]

const defaultLeads: Lead[] = [
  {
    id: 'lead_demo_1',
    clientId: 'client_demo_1',
    name: 'Mariana Souza',
    company: 'Clínica Vital',
    email: 'mariana@clinicavital.com',
    phone: '(31) 99999-1111',
    source: 'Instagram',
    stage: 'proposal',
    value: 1800,
    owner: 'Vanderson de Castro',
    nextAction: 'Enviar proposta revisada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const defaultCrmData: CrmData = {
  clients: defaultClients,
  leads: defaultLeads,
  activities: [],
  proposals: []
}

const dataService = new DataService(defaultCrmData)
const persist = (state: CrmData) => dataService.crm.save(state)
const saved = dataService.crm.load()

export const useCrmStore = create<CrmState>((set, get) => ({
  ...saved,

  addClient: (data) => set((state) => {
    const clients = [...state.clients, { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
    persist({ ...state, clients })
    return { clients }
  }),

  updateClient: (client) => set((state) => {
    const clients = state.clients.map((item) => item.id === client.id ? client : item)
    persist({ ...state, clients })
    return { clients }
  }),

  deleteClient: (id) => set((state) => {
    const client = state.clients.find((item) => item.id === id)
    if (client) trashRecord({ entityType: 'client', entityId: id, title: client.name, storageKey: 'crm_data', collection: 'clients', payload: client, deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const clients = state.clients.filter((item) => item.id !== id)
    persist({ ...state, clients })
    return { clients }
  }),

  addLead: (data) => set((state) => {
    const now = new Date().toISOString()
    const leads = [...state.leads, { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now, stageEnteredAt: now }]
    persist({ ...state, leads })
    return { leads }
  }),

  importLeads: (items) => {
    if (!items.length) return 0
    let importedCount = 0
    set((state) => {
      const now = new Date().toISOString()
      const existingKeys = new Set(state.leads.map((lead) => `${lead.email.trim().toLowerCase()}|${(lead.whatsapp || lead.phone).replace(/\D/g, '')}|${lead.cpf?.replace(/\D/g, '') || ''}`))
      const imported = items
        .filter((item) => {
          const key = `${item.email.trim().toLowerCase()}|${(item.whatsapp || item.phone).replace(/\D/g, '')}|${item.cpf?.replace(/\D/g, '') || ''}`
          if (existingKeys.has(key) && key !== '||') return false
          existingKeys.add(key)
          return true
        })
        .map((item) => ({ ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now, stageEnteredAt: now }))
      importedCount = imported.length
      const leads = [...state.leads, ...imported]
      persist({ ...state, leads })
      return { leads }
    })
    return importedCount
  },

  updateLead: (lead) => set((state) => {
    const leads = state.leads.map((item) => item.id === lead.id ? { ...lead, updatedAt: new Date().toISOString() } : item)
    persist({ ...state, leads })
    return { leads }
  }),

  moveLead: (id, stage) => set((state) => {
    const now = new Date().toISOString()
    const leads = state.leads.map((item) => item.id === id ? { ...item, stage, updatedAt: now, stageEnteredAt: now } : item)
    persist({ ...state, leads })
    return { leads }
  }),

  deleteLead: (id) => set((state) => {
    const lead = state.leads.find((item) => item.id === id)
    if (lead) trashRecord({ entityType: 'lead', entityId: id, title: lead.name, storageKey: 'crm_data', collection: 'leads', payload: lead, deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const leads = state.leads.filter((item) => item.id !== id)
    persist({ ...state, leads })
    return { leads }
  }),

  addActivity: (activity) => set((state) => {
    const activities = [{ ...activity, id: crypto.randomUUID() }, ...state.activities]
    persist({ ...state, activities })
    return { activities }
  }),

  addProposal: (data) => set((state) => {
    const proposals = [...state.proposals, { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
    persist({ ...state, proposals })
    return { proposals }
  }),

  updateProposal: (proposal) => set((state) => {
    const proposals = state.proposals.map((item) => item.id === proposal.id ? proposal : item)
    persist({ ...state, proposals })
    return { proposals }
  })
}))
