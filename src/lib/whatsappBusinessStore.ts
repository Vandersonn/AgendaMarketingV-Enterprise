import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface WhatsAppBusinessChannel {
  id: 'channel-1' | 'channel-2'
  name: string
  phoneNumber: string
  purpose: string
  enabled: boolean
}

interface WhatsAppBusinessState {
  channels: [WhatsAppBusinessChannel, WhatsAppBusinessChannel]
  assignments: Record<string, WhatsAppBusinessChannel['id']>
  updateChannel: (id: WhatsAppBusinessChannel['id'], patch: Partial<WhatsAppBusinessChannel>) => void
  assignContact: (contactKey: string, channelId: WhatsAppBusinessChannel['id']) => void
}

const defaults: [WhatsAppBusinessChannel, WhatsAppBusinessChannel] = [
  { id: 'channel-1', name: 'WhatsApp Comercial', phoneNumber: '', purpose: 'Vendas e novos Leads', enabled: true },
  { id: 'channel-2', name: 'WhatsApp Atendimento', phoneNumber: '', purpose: 'Clientes e suporte', enabled: true }
]

const saved = loadLocal<WhatsAppBusinessChannel[]>('whatsapp_business_channels', defaults)
const assignments = loadLocal<Record<string, WhatsAppBusinessChannel['id']>>('whatsapp_channel_assignments', {})
const initial = defaults.map((fallback) => ({ ...fallback, ...(saved.find((item) => item.id === fallback.id) || {}) })) as [WhatsAppBusinessChannel, WhatsAppBusinessChannel]

export const useWhatsAppBusinessStore = create<WhatsAppBusinessState>((set) => ({
  channels: initial,
  assignments,
  assignContact: (contactKey, channelId) => set((state) => {
    const next = { ...state.assignments, [contactKey]: channelId }
    saveLocal('whatsapp_channel_assignments', next)
    return { assignments: next }
  }),
  updateChannel: (id, patch) => set((state) => {
    const channels = state.channels.map((channel) => channel.id === id ? { ...channel, ...patch } : channel) as [WhatsAppBusinessChannel, WhatsAppBusinessChannel]
    saveLocal('whatsapp_business_channels', channels)
    return { channels }
  })
}))
