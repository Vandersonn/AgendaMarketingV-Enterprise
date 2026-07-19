import type { StorageProvider } from './StorageProvider.ts'

export class MemoryStorageProvider implements StorageProvider {
  private readonly values = new Map<string, unknown>()

  get<T>(key: string, fallback: T): T {
    return this.values.has(key) ? structuredClone(this.values.get(key) as T) : structuredClone(fallback)
  }

  set<T>(key: string, value: T): boolean {
    this.values.set(key, structuredClone(value))
    return true
  }

  remove(key: string): void {
    this.values.delete(key)
  }

  has(key: string): boolean {
    return this.values.has(key)
  }
}
