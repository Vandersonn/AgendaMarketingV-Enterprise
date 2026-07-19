import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type CampaignChannel = 'whatsapp' | 'email' | 'call'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface ContactCampaign {
  id: string
  name: string
  channel: CampaignChannel
  whatsappChannelId?: 'channel-1' | 'channel-2'
  leadIds: string[]
  message: string
  dailyLimit: number
  intervalMinutes: number
  status: CampaignStatus
  cursor: number
  contactedLeadIds: string[]
  createdAt: string
  updatedAt: string
}

interface ContactCampaignState {
  campaigns: ContactCampaign[]
  createCampaign: (data: Omit<ContactCampaign, 'id' | 'status' | 'cursor' | 'contactedLeadIds' | 'createdAt' | 'updatedAt'>) => string
  updateCampaign: (id: string, patch: Partial<ContactCampaign>) => void
  removeCampaign: (id: string) => void
  markContacted: (id: string, leadId: string) => void
}

const KEY = 'crm_contact_campaigns'
const initial = loadLocal<ContactCampaign[]>(KEY, [])
const persist = (campaigns: ContactCampaign[]) => saveLocal(KEY, campaigns)

export const useContactCampaignStore = create<ContactCampaignState>((set) => ({
  campaigns: initial,
  createCampaign: (data) => {
    const id = crypto.randomUUID()
    set((state) => {
      const now = new Date().toISOString()
      const campaigns = [...state.campaigns, { ...data, id, status: 'draft' as const, cursor: 0, contactedLeadIds: [], createdAt: now, updatedAt: now }]
      persist(campaigns)
      return { campaigns }
    })
    return id
  },
  updateCampaign: (id, patch) => set((state) => {
    const campaigns = state.campaigns.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)
    persist(campaigns)
    return { campaigns }
  }),
  removeCampaign: (id) => set((state) => {
    const campaigns = state.campaigns.filter((item) => item.id !== id)
    persist(campaigns)
    return { campaigns }
  }),
  markContacted: (id, leadId) => set((state) => {
    const campaigns = state.campaigns.map((item) => item.id === id ? {
      ...item,
      contactedLeadIds: Array.from(new Set([...item.contactedLeadIds, leadId])),
      cursor: Math.min(item.leadIds.length, item.cursor + 1),
      status: item.contactedLeadIds.length + 1 >= item.leadIds.length ? 'completed' as const : item.status,
      updatedAt: new Date().toISOString()
    } : item)
    persist(campaigns)
    return { campaigns }
  })
}))
