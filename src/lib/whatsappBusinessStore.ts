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
  updateChannel: (id: WhatsAppBusinessChannel['id'], patch: Partial<WhatsAppBusinessChannel>) => void
}

const defaults: [WhatsAppBusinessChannel, WhatsAppBusinessChannel] = [
  { id: 'channel-1', name: 'WhatsApp Comercial', phoneNumber: '', purpose: 'Vendas e novos Leads', enabled: true },
  { id: 'channel-2', name: 'WhatsApp Atendimento', phoneNumber: '', purpose: 'Clientes e suporte', enabled: true }
]

const saved = loadLocal<WhatsAppBusinessChannel[]>('whatsapp_business_channels', defaults)
const initial = defaults.map((fallback) => ({ ...fallback, ...(saved.find((item) => item.id === fallback.id) || {}) })) as [WhatsAppBusinessChannel, WhatsAppBusinessChannel]

export const useWhatsAppBusinessStore = create<WhatsAppBusinessState>((set) => ({
  channels: initial,
  updateChannel: (id, patch) => set((state) => {
    const channels = state.channels.map((channel) => channel.id === id ? { ...channel, ...patch } : channel) as [WhatsAppBusinessChannel, WhatsAppBusinessChannel]
    saveLocal('whatsapp_business_channels', channels)
    return { channels }
  })
}))
