export interface StorageProvider {
  get<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): boolean
  remove(key: string): void
  has(key: string): boolean
}
