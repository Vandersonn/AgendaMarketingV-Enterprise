import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type RelationshipStatus = 'prospect' | 'active' | 'at_risk' | 'inactive'

export interface ClientRelationshipProfile {
  clientId: string
  status: RelationshipStatus
  score: number
  tags: string[]
  owner: string
  lastContactAt?: string
  nextContactAt?: string
  updatedAt: string
}

interface ClientRelationshipState {
  profiles: ClientRelationshipProfile[]
  upsertProfile: (clientId: string, data: Partial<Omit<ClientRelationshipProfile, 'clientId' | 'updatedAt'>>) => void
  addTag: (clientId: string, tag: string) => void
  removeTag: (clientId: string, tag: string) => void
}

const STORAGE_KEY = 'client_relationship_profiles'
const initial = loadLocal<ClientRelationshipProfile[]>(STORAGE_KEY, [])

function persist(profiles: ClientRelationshipProfile[]) {
  saveLocal(STORAGE_KEY, profiles)
}

function normalizeScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export const useClientRelationshipStore = create<ClientRelationshipState>((set) => ({
  profiles: initial,

  upsertProfile: (clientId, data) => set((state) => {
    const current = state.profiles.find((profile) => profile.clientId === clientId)
    const next: ClientRelationshipProfile = {
      clientId,
      status: data.status ?? current?.status ?? 'prospect',
      score: normalizeScore(data.score ?? current?.score ?? 50),
      tags: data.tags ?? current?.tags ?? [],
      owner: data.owner ?? current?.owner ?? '',
      lastContactAt: data.lastContactAt ?? current?.lastContactAt,
      nextContactAt: data.nextContactAt ?? current?.nextContactAt,
      updatedAt: new Date().toISOString()
    }
    const profiles = current
      ? state.profiles.map((profile) => profile.clientId === clientId ? next : profile)
      : [...state.profiles, next]
    persist(profiles)
    return { profiles }
  }),

  addTag: (clientId, tag) => set((state) => {
    const clean = tag.trim()
    if (!clean) return state
    const current = state.profiles.find((profile) => profile.clientId === clientId)
    const tags = Array.from(new Set([...(current?.tags ?? []), clean]))
    const next: ClientRelationshipProfile = {
      clientId,
      status: current?.status ?? 'prospect',
      score: current?.score ?? 50,
      tags,
      owner: current?.owner ?? '',
      lastContactAt: current?.lastContactAt,
      nextContactAt: current?.nextContactAt,
      updatedAt: new Date().toISOString()
    }
    const profiles = current
      ? state.profiles.map((profile) => profile.clientId === clientId ? next : profile)
      : [...state.profiles, next]
    persist(profiles)
    return { profiles }
  }),

  removeTag: (clientId, tag) => set((state) => {
    const current = state.profiles.find((profile) => profile.clientId === clientId)
    if (!current) return state
    const profiles = state.profiles.map((profile) => profile.clientId === clientId
      ? { ...profile, tags: profile.tags.filter((item) => item !== tag), updatedAt: new Date().toISOString() }
      : profile)
    persist(profiles)
    return { profiles }
  })
}))
