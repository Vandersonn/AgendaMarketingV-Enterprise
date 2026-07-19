import assert from 'node:assert/strict'
import test from 'node:test'
import { MemoryStorageProvider } from '../src/data/providers/MemoryStorageProvider.ts'
import { CrmRepository, CRM_STORAGE_KEY, type CrmData } from '../src/data/repositories/CrmRepository.ts'
import { CURRENT_DATA_SCHEMA_VERSION, DATA_SCHEMA_KEY, migrateLegacyData } from '../src/data/migrations/migrateLegacyData.ts'

const empty: CrmData = { clients: [], leads: [], activities: [], proposals: [] }

test('repositório persiste e recupera os dados do CRM', () => {
  const storage = new MemoryStorageProvider()
  const repository = new CrmRepository(storage, empty)
  const client = { id: 'c1', name: 'Cliente Teste', company: '', email: '', phone: '', city: '', state: '', document: '', notes: '', createdAt: '2026-01-01' }
  const updated = repository.addClient(repository.load(), client)
  assert.equal(repository.save(updated), true)
  assert.equal(repository.load().clients[0]?.name, 'Cliente Teste')
})

test('repositório atualiza e remove registros sem alterar outras coleções', () => {
  const storage = new MemoryStorageProvider()
  const repository = new CrmRepository(storage, empty)
  const base = { ...empty, clients: [{ id: 'c1', name: 'A', company: '', email: '', phone: '', city: '', state: '', document: '', notes: '', createdAt: 'x' }] }
  const changed = repository.updateClient(base, { ...base.clients[0], name: 'B' })
  assert.equal(changed.clients[0]?.name, 'B')
  assert.deepEqual(repository.removeClient(changed, 'c1').clients, [])
  assert.deepEqual(changed.leads, [])
})

test('migração normaliza estrutura legada incompleta e grava a versão', () => {
  const storage = new MemoryStorageProvider()
  storage.set(CRM_STORAGE_KEY, { clients: [{ id: 'c1', name: 'Legado' }] })
  const migrated = migrateLegacyData(storage, empty)
  assert.equal(migrated.clients.length, 1)
  assert.deepEqual(migrated.leads, [])
  assert.equal(storage.get(DATA_SCHEMA_KEY, 0), CURRENT_DATA_SCHEMA_VERSION)
})

test('migração é idempotente', () => {
  const storage = new MemoryStorageProvider()
  const first = migrateLegacyData(storage, empty)
  const second = migrateLegacyData(storage, empty)
  assert.deepEqual(second, first)
})
