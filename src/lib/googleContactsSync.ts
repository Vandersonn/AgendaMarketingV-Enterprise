import type { Client, Lead } from './crmTypes'
import { loadLocal, saveLocal } from './storage'

export interface GoogleContact {
  resourceName: string
  etag: string
  name: string
  email: string
  phone: string
  company: string
  sources: Array<Record<string, unknown>>
}

export interface LocalContact {
  type: 'client' | 'lead'
  id: string
  name: string
  email: string
  phone: string
  company: string
}

export interface ContactBinding {
  resourceName: string
  localType: LocalContact['type']
  localId: string
  linkedAt: string
}

export interface ContactSyncPlan {
  googleOnly: GoogleContact[]
  localOnly: LocalContact[]
  matched: Array<{ google: GoogleContact; local: LocalContact }>
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits
}

function identities(contact: { email: string; phone: string }): string[] {
  const email = normalizeEmail(contact.email)
  const phone = normalizePhone(contact.phone)
  return [email ? `email:${email}` : '', phone ? `phone:${phone}` : ''].filter(Boolean)
}

export function collectLocalContacts(clients: Client[], leads: Lead[]): LocalContact[] {
  const contacts: LocalContact[] = [
    ...clients.map((item) => ({ type: 'client' as const, id: item.id, name: item.name, email: item.email, phone: item.phone, company: item.company })),
    ...leads.map((item) => ({ type: 'lead' as const, id: item.id, name: item.name, email: item.email, phone: item.whatsapp || item.phone, company: item.company }))
  ]
  const seen = new Set<string>()
  return contacts.filter((contact) => {
    const keys = identities(contact)
    if (keys.some((key) => seen.has(key))) return false
    keys.forEach((key) => seen.add(key))
    return Boolean(contact.name.trim())
  })
}

export function loadContactBindings(): ContactBinding[] {
  return loadLocal<ContactBinding[]>('google_contact_bindings', [])
}

export function saveContactBindings(bindings: ContactBinding[]): void {
  saveLocal('google_contact_bindings', bindings)
}

export function mergeContactBindings(
  current: ContactBinding[],
  matched: ContactSyncPlan['matched']
): ContactBinding[] {
  const byResource = new Map(current.map((binding) => [binding.resourceName, binding]))
  matched.forEach(({ google, local }) => {
    byResource.set(google.resourceName, {
      resourceName: google.resourceName,
      localType: local.type,
      localId: local.id,
      linkedAt: byResource.get(google.resourceName)?.linkedAt || new Date().toISOString()
    })
  })
  return [...byResource.values()]
}

export function buildContactSyncPlan(
  googleContacts: GoogleContact[],
  localContacts: LocalContact[],
  bindings: ContactBinding[] = []
): ContactSyncPlan {
  const localById = new Map(localContacts.map((contact) => [`${contact.type}:${contact.id}`, contact]))
  const bindingByResource = new Map(bindings.map((binding) => [
    binding.resourceName,
    localById.get(`${binding.localType}:${binding.localId}`)
  ]))
  const localIndex = new Map<string, LocalContact>()
  localContacts.forEach((contact) => identities(contact).forEach((key) => localIndex.set(key, contact)))

  const matched: ContactSyncPlan['matched'] = []
  const matchedLocalIds = new Set<string>()
  const googleOnly: GoogleContact[] = []

  googleContacts.forEach((google) => {
    const local = bindingByResource.get(google.resourceName)
      || identities(google).map((key) => localIndex.get(key)).find(Boolean)
    if (!local) {
      googleOnly.push(google)
      return
    }
    matched.push({ google, local })
    matchedLocalIds.add(`${local.type}:${local.id}`)
  })

  const localOnly = localContacts.filter((local) => !matchedLocalIds.has(`${local.type}:${local.id}`))
  return { googleOnly, localOnly, matched }
}

export function contactRecordsDiffer(google: GoogleContact, local: LocalContact): boolean {
  return google.name.trim() !== local.name.trim()
    || normalizeEmail(google.email) !== normalizeEmail(local.email)
    || normalizePhone(google.phone) !== normalizePhone(local.phone)
    || google.company.trim() !== local.company.trim()
}
