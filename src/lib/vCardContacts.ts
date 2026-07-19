import { normalizeEmail, normalizePhone, type LocalContact } from './googleContactsSync.ts'

export interface VCardContact {
  name: string
  email: string
  phone: string
  company: string
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function propertyValue(lines: string[], property: string): string {
  const prefix = property.toUpperCase()
  const line = lines.find((item) => {
    const key = item.slice(0, item.indexOf(':')).toUpperCase()
    return key === prefix || key.startsWith(`${prefix};`)
  })
  return line ? unescapeValue(line.slice(line.indexOf(':') + 1)) : ''
}

function identities(contact: { email: string; phone: string }): string[] {
  const email = normalizeEmail(contact.email)
  const phone = normalizePhone(contact.phone)
  return [email ? `email:${email}` : '', phone ? `phone:${phone}` : ''].filter(Boolean)
}

export function parseVCardContacts(content: string): VCardContact[] {
  const unfolded = content.replace(/\r?\n[ \t]/g, '')
  const cards = unfolded.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) || []
  const seen = new Set<string>()

  return cards.flatMap((card) => {
    const lines = card.split(/\r?\n/).filter((line) => line.includes(':'))
    const structuredName = propertyValue(lines, 'N').split(';').filter(Boolean).reverse().join(' ').trim()
    const contact: VCardContact = {
      name: propertyValue(lines, 'FN') || structuredName,
      email: propertyValue(lines, 'EMAIL'),
      phone: propertyValue(lines, 'TEL'),
      company: propertyValue(lines, 'ORG').split(';')[0]
    }
    if (!contact.name) contact.name = contact.email || contact.phone
    const keys = identities(contact)
    if (!contact.name || !keys.length || keys.some((key) => seen.has(key))) return []
    keys.forEach((key) => seen.add(key))
    return [contact]
  })
}

export function newVCardContacts(imported: VCardContact[], local: LocalContact[]): VCardContact[] {
  const existing = new Set(local.flatMap(identities))
  return imported.filter((contact) => !identities(contact).some((key) => existing.has(key)))
}

export function createVCard(contacts: Array<Pick<LocalContact, 'name' | 'email' | 'phone' | 'company'>>): string {
  return contacts.map((contact) => [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeValue(contact.name)}`,
    contact.company ? `ORG:${escapeValue(contact.company)}` : '',
    contact.phone ? `TEL;TYPE=CELL:${escapeValue(contact.phone)}` : '',
    contact.email ? `EMAIL;TYPE=INTERNET:${escapeValue(contact.email)}` : '',
    'END:VCARD'
  ].filter(Boolean).join('\r\n')).join('\r\n')
}
