import { useEffect, useState } from 'react'
import { loadLocal, saveLocal } from '../lib/storage'
import type { ThemeMode } from '../lib/types'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadLocal('theme', 'light'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveLocal('theme', theme)
  }, [theme])

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }
}
