import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import type { LicensePlan } from './licenseStore'
import { logSystem } from './systemLogStore'

export const LICENSE_OWNER_EMAIL = 'produtosecursosnet@gmail.com'

export type AuthorityLicenseStatus = 'available' | 'active' | 'revoked' | 'expired'

export interface AuthorityLicense {
  id: string
  key: string
  plan: LicensePlan
  status: AuthorityLicenseStatus
  customerName: string
  customerEmail: string
  companyName: string
  cnpj: string
  maxDevices: number
  issuedAt: string
  expiresAt: string
  activatedAt: string
  notes: string
  certificate: string
}

interface AuthoritySession {
  unlocked: boolean
  unlockedAt: string
}

interface LicenseAuthorityState {
  initialized: boolean
  passwordHash: string
  licenses: AuthorityLicense[]
  session: AuthoritySession
  setupPassword: (password: string) => Promise<{ ok: boolean; message: string }>
  unlock: (password: string) => Promise<{ ok: boolean; message: string }>
  lock: () => void
  generate: (input: {
    plan: LicensePlan
    customerName: string
    customerEmail: string
    companyName: string
    cnpj: string
    maxDevices: number
    expiresAt: string
    notes: string
  }) => Promise<AuthorityLicense>
  revoke: (id: string) => void
  restore: (id: string) => void
  renew: (id: string, expiresAt: string) => Promise<void>
  updateDeviceLimit: (id: string, maxDevices: number) => Promise<void>
  remove: (id: string) => void
  markActivated: (key: string) => void
  importRegistry: (licenses: AuthorityLicense[]) => void
}

const AUTHORITY_SECRET = 'DEVVANDERSONAPPS::39551372000141::LICENSE-AUTHORITY-V1'

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function randomBlock(length = 4): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes).map((value) => alphabet[value % alphabet.length]).join('')
}

function makeKey(plan: LicensePlan): string {
  const prefix = plan === 'enterprise' ? 'ENT' : plan.toUpperCase()
  return `AMV-${prefix}-${randomBlock()}-${randomBlock()}-${randomBlock()}`
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function makeCertificate(license: Omit<AuthorityLicense, 'certificate'>): Promise<string> {
  const payload = base64UrlEncode(JSON.stringify({
    version: 1,
    key: license.key,
    plan: license.plan,
    customerName: license.customerName,
    customerEmail: license.customerEmail,
    companyName: license.companyName,
    cnpj: license.cnpj,
    maxDevices: license.maxDevices,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt
  }))
  const signature = await sha256(`${payload}.${AUTHORITY_SECRET}`)
  return `AMVCERT1.${payload}.${signature}`
}

const stored = loadLocal<{
  initialized?: boolean
  passwordHash?: string
  licenses?: AuthorityLicense[]
}>('license_authority', {})

function persist(initialized: boolean, passwordHash: string, licenses: AuthorityLicense[]) {
  saveLocal('license_authority', { initialized, passwordHash, licenses })
}

export async function validateOfflineCertificate(certificate: string): Promise<{
  ok: boolean
  message: string
  data?: {
    key: string
    plan: LicensePlan
    expiresAt: string
    maxDevices: number
    customerName: string
    customerEmail: string
    companyName: string
  }
}> {
  try {
    const [prefix, payload, signature] = certificate.trim().split('.')
    if (prefix !== 'AMVCERT1' || !payload || !signature) {
      return { ok: false, message: 'Certificado inválido.' }
    }
    const expected = await sha256(`${payload}.${AUTHORITY_SECRET}`)
    if (expected !== signature) return { ok: false, message: 'Assinatura do certificado inválida.' }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const data = JSON.parse(new TextDecoder().decode(bytes))

    if (!data.key || !data.plan || !data.expiresAt) {
      return { ok: false, message: 'Certificado incompleto.' }
    }
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'Certificado expirado.' }
    }

    return { ok: true, message: 'Certificado válido.', data }
  } catch {
    return { ok: false, message: 'Não foi possível interpretar o certificado.' }
  }
}

export const useLicenseAuthorityStore = create<LicenseAuthorityState>((set, get) => ({
  initialized: stored.initialized ?? false,
  passwordHash: stored.passwordHash ?? '',
  licenses: Array.isArray(stored.licenses) ? stored.licenses : [],
  session: { unlocked: false, unlockedAt: '' },

  setupPassword: async (password) => {
    if (password.length < 8) return { ok: false, message: 'Use pelo menos 8 caracteres.' }
    const passwordHash = await sha256(`${LICENSE_OWNER_EMAIL}:${password}`)
    const current = get()
    persist(true, passwordHash, current.licenses)
    set({ initialized: true, passwordHash, session: { unlocked: true, unlockedAt: new Date().toISOString() } })
    logSystem('info', 'License Authority', 'Senha-mestra configurada', LICENSE_OWNER_EMAIL)
    return { ok: true, message: 'Senha-mestra configurada.' }
  },

  unlock: async (password) => {
    const candidate = await sha256(`${LICENSE_OWNER_EMAIL}:${password}`)
    if (candidate !== get().passwordHash) return { ok: false, message: 'Senha-mestra inválida.' }
    set({ session: { unlocked: true, unlockedAt: new Date().toISOString() } })
    return { ok: true, message: 'Autoridade de licenças desbloqueada.' }
  },

  lock: () => set({ session: { unlocked: false, unlockedAt: '' } }),

  generate: async (input) => {
    if (!get().session.unlocked) throw new Error('Autoridade bloqueada.')
    const issuedAt = new Date().toISOString()
    const base: Omit<AuthorityLicense, 'certificate'> = {
      id: crypto.randomUUID(),
      key: makeKey(input.plan),
      plan: input.plan,
      status: 'available',
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim(),
      companyName: input.companyName.trim(),
      cnpj: input.cnpj.trim(),
      maxDevices: Math.max(1, input.maxDevices),
      issuedAt,
      expiresAt: input.expiresAt,
      activatedAt: '',
      notes: input.notes.trim()
    }
    const license: AuthorityLicense = { ...base, certificate: await makeCertificate(base) }
    const licenses = [license, ...get().licenses]
    persist(get().initialized, get().passwordHash, licenses)
    set({ licenses })
    logSystem('info', 'License Authority', `Chave ${license.key} gerada`, license.customerEmail || license.companyName)
    return license
  },

  revoke: (id) => set((state) => {
    const licenses = state.licenses.map((item) => item.id === id ? { ...item, status: 'revoked' as const } : item)
    persist(state.initialized, state.passwordHash, licenses)
    return { licenses }
  }),

  restore: (id) => set((state) => {
    const licenses = state.licenses.map((item) => item.id === id ? { ...item, status: 'available' as const } : item)
    persist(state.initialized, state.passwordHash, licenses)
    return { licenses }
  }),


  renew: async (id, expiresAt) => {
    const current = get().licenses.find((item) => item.id === id)
    if (!current) return
    const base: Omit<AuthorityLicense, 'certificate'> = {
      ...current,
      status: 'available',
      expiresAt,
      activatedAt: current.activatedAt
    }
    const updated: AuthorityLicense = { ...base, certificate: await makeCertificate(base) }
    const licenses = get().licenses.map((item) => item.id === id ? updated : item)
    persist(get().initialized, get().passwordHash, licenses)
    set({ licenses })
    logSystem('info', 'License Authority', `Licença ${updated.key} renovada`, expiresAt)
  },

  updateDeviceLimit: async (id, maxDevices) => {
    const current = get().licenses.find((item) => item.id === id)
    if (!current) return
    const base: Omit<AuthorityLicense, 'certificate'> = {
      ...current,
      maxDevices: Math.max(1, maxDevices)
    }
    const updated: AuthorityLicense = { ...base, certificate: await makeCertificate(base) }
    const licenses = get().licenses.map((item) => item.id === id ? updated : item)
    persist(get().initialized, get().passwordHash, licenses)
    set({ licenses })
    logSystem('info', 'License Authority', `Limite da licença ${updated.key} atualizado`, String(updated.maxDevices))
  },

  remove: (id) => set((state) => {
    const licenses = state.licenses.filter((item) => item.id !== id)
    persist(state.initialized, state.passwordHash, licenses)
    return { licenses }
  }),

  markActivated: (key) => set((state) => {
    const licenses = state.licenses.map((item) => item.key === key ? {
      ...item,
      status: 'active' as const,
      activatedAt: item.activatedAt || new Date().toISOString()
    } : item)
    persist(state.initialized, state.passwordHash, licenses)
    return { licenses }
  }),

  importRegistry: (incoming) => set((state) => {
    const map = new Map(state.licenses.map((item) => [item.id, item]))
    incoming.forEach((item) => map.set(item.id, item))
    const licenses = [...map.values()].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    persist(state.initialized, state.passwordHash, licenses)
    return { licenses }
  })
}))
