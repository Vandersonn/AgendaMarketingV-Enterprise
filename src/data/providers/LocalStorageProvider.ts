import { loadLocal, removeLocal, saveLocal } from '../../lib/storage.ts'
import type { StorageProvider } from './StorageProvider.ts'

const prefix = 'amv_professional_'

export class LocalStorageProvider implements StorageProvider {
  get<T>(key: string, fallback: T): T {
    return loadLocal(key, fallback)
  }

  set<T>(key: string, value: T): boolean {
    return saveLocal(key, value)
  }

  remove(key: string): void {
    removeLocal(key)
  }

  has(key: string): boolean {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(prefix + key) !== null
    } catch {
      return false
    }
  }
}
