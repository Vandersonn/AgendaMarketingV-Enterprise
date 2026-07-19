import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface RecentNavigationItem {
  path: string
  label: string
  visitedAt: string
}

interface NavigationPreferencesState {
  favorites: string[]
  recent: RecentNavigationItem[]
  toggleFavorite: (path: string) => void
  recordVisit: (path: string, label: string) => void
}

const FAVORITES_KEY = 'navigation_favorites'
const RECENT_KEY = 'navigation_recent'

export const useNavigationPreferencesStore = create<NavigationPreferencesState>((set, get) => ({
  favorites: loadLocal<string[]>(FAVORITES_KEY, []),
  recent: loadLocal<RecentNavigationItem[]>(RECENT_KEY, []),
  toggleFavorite: (path) => {
    const current = get().favorites
    const favorites = current.includes(path)
      ? current.filter((item) => item !== path)
      : [...current, path].slice(-6)
    saveLocal(FAVORITES_KEY, favorites)
    set({ favorites })
  },
  recordVisit: (path, label) => {
    if (!path || path === '/login') return
    const recent = [
      { path, label, visitedAt: new Date().toISOString() },
      ...get().recent.filter((item) => item.path !== path)
    ].slice(0, 5)
    saveLocal(RECENT_KEY, recent)
    set({ recent })
  }
}))
