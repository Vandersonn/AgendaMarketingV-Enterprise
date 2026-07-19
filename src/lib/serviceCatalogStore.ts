import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface ServiceItem {
  id: string
  name: string
  category: string
  description: string
  price: number
  billing: 'one_time' | 'monthly' | 'yearly'
  active: boolean
  estimatedDays: number
  createdAt: string
}

interface ServiceCatalogState {
  services: ServiceItem[]
  addService: (service: Omit<ServiceItem, 'id' | 'createdAt'>) => void
  toggleActive: (id: string) => void
  removeService: (id: string) => void
}

const initial = loadLocal<ServiceItem[]>('service_catalog', [
  {
    id: 'social-management',
    name: 'Gestão de Redes Sociais',
    category: 'Marketing',
    description: 'Planejamento, criação, publicação e acompanhamento de conteúdo.',
    price: 1500,
    billing: 'monthly',
    active: true,
    estimatedDays: 30,
    createdAt: new Date().toISOString()
  },
  {
    id: 'wordpress-site',
    name: 'Site WordPress Profissional',
    category: 'Desenvolvimento',
    description: 'Site institucional responsivo e otimizado.',
    price: 2800,
    billing: 'one_time',
    active: true,
    estimatedDays: 20,
    createdAt: new Date().toISOString()
  }
])

function persist(services: ServiceItem[]) {
  saveLocal('service_catalog', services)
}

export const useServiceCatalogStore = create<ServiceCatalogState>((set) => ({
  services: initial,
  addService: (data) => set((state) => {
    const services = [{
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }, ...state.services]
    persist(services)
    return { services }
  }),
  toggleActive: (id) => set((state) => {
    const services = state.services.map((item) => item.id === id ? { ...item, active: !item.active } : item)
    persist(services)
    return { services }
  }),
  removeService: (id) => set((state) => {
    const services = state.services.filter((item) => item.id !== id)
    persist(services)
    return { services }
  })
}))
