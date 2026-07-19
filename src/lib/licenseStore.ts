import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'
import { useLicenseActivationStore } from './licenseActivationStore'

export type LicensePlan = 'free' | 'pro' | 'enterprise'
export type LicenseStatus = 'trial' | 'active' | 'expired' | 'blocked'

export interface LicenseStateData {
  key: string
  plan: LicensePlan
  status: LicenseStatus
  activatedAt: string
  expiresAt: string
  organizationId: string
  deviceId: string
  lastValidationAt: string
}

interface LicenseState {
  license: LicenseStateData
  activate: (key: string, organizationId: string) => { ok: boolean; message: string }
  activateIssued: (data: {
    key: string
    plan: LicensePlan
    expiresAt: string
    organizationId: string
  }) => { ok: boolean; message: string }
  startTrial: (organizationId: string) => void
  deactivate: () => void
  validate: () => void
}

function getDeviceId(): string {
  const existing = localStorage.getItem('amv_device_id')
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem('amv_device_id', id)
  return id
}

function emptyLicense(): LicenseStateData {
  return {
    key: '',
    plan: 'free',
    status: 'trial',
    activatedAt: '',
    expiresAt: '',
    organizationId: '',
    deviceId: getDeviceId(),
    lastValidationAt: ''
  }
}

const initial = loadLocal<LicenseStateData>('license', emptyLicense())

function persist(license: LicenseStateData) {
  saveLocal('license', license)
}

function findIssuedLicense(key: string): {
  key: string
  plan: LicensePlan
  status: string
  expiresAt: string
  maxDevices: number
} | null {
  const authority = loadLocal<{ licenses?: Array<{
    key: string
    plan: LicensePlan
    status: string
    expiresAt: string
    maxDevices: number
  }> }>('license_authority', {})
  return authority.licenses?.find((item) => item.key === key.trim().toUpperCase()) ?? null
}

function expirationFor(plan: LicensePlan): string {
  const date = new Date()
  if (plan === 'free') date.setDate(date.getDate() + 30)
  if (plan === 'pro') date.setFullYear(date.getFullYear() + 1)
  if (plan === 'enterprise') date.setFullYear(date.getFullYear() + 2)
  return date.toISOString()
}

export const useLicenseStore = create<LicenseState>((set, get) => ({
  license: initial,

  activate: (key, organizationId) => {
    const normalized = key.trim().toUpperCase()
    const issued = findIssuedLicense(normalized)
    if (!issued) return { ok: false, message: 'Chave não emitida pela Autoridade de Licenças.' }
    if (issued.status === 'revoked') return { ok: false, message: 'Esta licença foi revogada.' }
    if (new Date(`${issued.expiresAt}T23:59:59`).getTime() < Date.now()) {
      return { ok: false, message: 'Esta licença está expirada.' }
    }

    const deviceId = getDeviceId()
    const activation = useLicenseActivationStore.getState().registerActivation({
      licenseKey: normalized,
      deviceId,
      organizationId,
      maxDevices: issued.maxDevices || 1
    })
    if (!activation.ok) return { ok: false, message: activation.message }

    const now = new Date().toISOString()
    const license: LicenseStateData = {
      key: normalized,
      plan: issued.plan,
      status: 'active',
      activatedAt: now,
      expiresAt: new Date(`${issued.expiresAt}T23:59:59`).toISOString(),
      organizationId,
      deviceId,
      lastValidationAt: now
    }

    persist(license)
    set({ license })
    logSystem('info', 'Licenciamento', `Plano ${issued.plan} ativado`, organizationId)
    return { ok: true, message: `Licença ${issued.plan.toUpperCase()} ativada com sucesso.` }
  },

  activateIssued: (data) => {
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'O certificado está expirado.' }
    }
    const deviceId = getDeviceId()
    const authority = findIssuedLicense(data.key)
    const activation = useLicenseActivationStore.getState().registerActivation({
      licenseKey: data.key,
      deviceId,
      organizationId: data.organizationId,
      maxDevices: authority?.maxDevices || 1
    })
    if (!activation.ok) return { ok: false, message: activation.message }

    const now = new Date().toISOString()
    const license: LicenseStateData = {
      key: data.key,
      plan: data.plan,
      status: 'active',
      activatedAt: now,
      expiresAt: data.expiresAt,
      organizationId: data.organizationId,
      deviceId,
      lastValidationAt: now
    }
    persist(license)
    set({ license })
    logSystem('info', 'Licenciamento', `Certificado ${data.plan} ativado`, data.organizationId)
    return { ok: true, message: `Certificado ${data.plan.toUpperCase()} ativado com sucesso.` }
  },

  startTrial: (organizationId) => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    const license: LicenseStateData = {
      key: 'TRIAL',
      plan: 'pro',
      status: 'trial',
      activatedAt: new Date().toISOString(),
      expiresAt: date.toISOString(),
      organizationId,
      deviceId: getDeviceId(),
      lastValidationAt: new Date().toISOString()
    }
    persist(license)
    set({ license })
  },

  deactivate: () => {
    const license = emptyLicense()
    persist(license)
    set({ license })
  },

  validate: () => {
    const current = get().license
    if (!current.expiresAt) return
    const expired = new Date(current.expiresAt).getTime() < Date.now()
    const license = {
      ...current,
      status: expired ? 'expired' as const : current.status,
      lastValidationAt: new Date().toISOString()
    }
    if (license.key && license.status === 'active') {
      useLicenseActivationStore.getState().touchActivation(license.key, license.deviceId)
    }
    persist(license)
    set({ license })
  }
}))
