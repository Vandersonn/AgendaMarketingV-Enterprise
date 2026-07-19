import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import type { AiAsset, IntegrationConfig, MetricRecord } from './aiTypes'
import { trashRecord } from './trashStore'

const defaultIntegrations: IntegrationConfig = {
  imageEndpoint: '',
  textEndpoint: '',
  whatsappWebhook: '',
  generalWebhook: '',
  powerBiUrl: '',
  canvaUrl: 'https://www.canva.com',
  facebookUrl: 'https://business.facebook.com',
  instagramUrl: 'https://www.instagram.com',
  metaBusinessUrl: 'https://business.facebook.com/latest/home',
  n8nWebhook: '',
  makeWebhook: '',
  supabaseUrl: '',
  googleCalendarUrl: 'https://calendar.google.com',
  gmailUrl: 'https://mail.google.com'
}

interface AiState {
  assets: AiAsset[]
  metrics: MetricRecord[]
  integrations: IntegrationConfig
  addAsset: (asset: Omit<AiAsset, 'id' | 'createdAt' | 'favorite'>) => void
  toggleFavorite: (id: string) => void
  deleteAsset: (id: string) => void
  addMetric: (metric: Omit<MetricRecord, 'id' | 'createdAt'>) => void
  deleteMetric: (id: string) => void
  saveIntegrations: (config: IntegrationConfig) => void
}

const saved = loadLocal<{
  assets: AiAsset[]
  metrics: MetricRecord[]
  integrations: IntegrationConfig
}>('phase4_data', {
  assets: [],
  metrics: [],
  integrations: defaultIntegrations
})

function persist(data: { assets: AiAsset[]; metrics: MetricRecord[]; integrations: IntegrationConfig }) {
  saveLocal('phase4_data', data)
}

export const useAiStore = create<AiState>((set) => ({
  ...saved,

  addAsset: (asset) => set((state) => {
    const assets = [{
      ...asset,
      id: crypto.randomUUID(),
      favorite: false,
      createdAt: new Date().toISOString()
    }, ...state.assets]
    persist({ ...state, assets })
    return { assets }
  }),

  toggleFavorite: (id) => set((state) => {
    const assets = state.assets.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item)
    persist({ ...state, assets })
    return { assets }
  }),

  deleteAsset: (id) => set((state) => {
    const asset = state.assets.find((item) => item.id === id)
    if (asset) trashRecord({ entityType: 'ai_asset', entityId: id, title: asset.title || 'Ativo de IA', storageKey: 'phase4_data', collection: 'assets', payload: asset, deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const assets = state.assets.filter((item) => item.id !== id)
    persist({ ...state, assets })
    return { assets }
  }),

  addMetric: (metric) => set((state) => {
    const metrics = [{
      ...metric,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }, ...state.metrics]
    persist({ ...state, metrics })
    return { metrics }
  }),

  deleteMetric: (id) => set((state) => {
    const metric = state.metrics.find((item) => item.id === id)
    if (metric) trashRecord({ entityType: 'metric', entityId: id, title: metric.campaign || metric.source || 'Métrica', storageKey: 'phase4_data', collection: 'metrics', payload: metric, deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const metrics = state.metrics.filter((item) => item.id !== id)
    persist({ ...state, metrics })
    return { metrics }
  }),

  saveIntegrations: (integrations) => set((state) => {
    persist({ ...state, integrations })
    return { integrations }
  })
}))
