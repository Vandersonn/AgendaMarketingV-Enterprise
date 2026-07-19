import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')

function sourceFiles(directory: string): string[] {
  const absolute = new URL(directory, root).pathname
  return readdirSync(absolute).flatMap((name) => {
    const file = join(absolute, name)
    return statSync(file).isDirectory()
      ? sourceFiles(`${directory}/${name}`)
      : /\.(tsx?|jsx?)$/.test(name) ? [file] : []
  })
}

test('Modal não reinicia o foco quando onClose muda durante a digitação', () => {
  const modal = read('src/components/Modal.tsx')
  assert.match(modal, /const onCloseRef = useRef\(onClose\)/)
  assert.match(modal, /useEffect\(\(\) => \{[\s\S]*?onCloseRef\.current = onClose[\s\S]*?\}, \[onClose\]\)/)
  assert.match(modal, /\}, \[open, initialFocusSelector\]\)/)
  assert.doesNotMatch(modal, /\}, \[open, onClose/)
})

test('Modal mantém Tab dentro da janela e restaura o foco ao fechar', () => {
  const modal = read('src/components/Modal.tsx')
  assert.match(modal, /event\.key !== 'Tab'/)
  assert.match(modal, /last\.focus\(\)/)
  assert.match(modal, /first\.focus\(\)/)
  assert.match(modal, /previous\?\.isConnected/)
})

test('formulários não usam atualização de estado suscetível a caracteres perdidos', () => {
  const offenders = sourceFiles('src').filter((file) => {
    const source = readFileSync(file, 'utf8')
    return /set(?:Form|Client|Customer|Lead)\s*\(\s*\{\s*\.\.\.(?:form|client|customer|lead)\s*,/.test(source)
  })
  assert.deepEqual(offenders, [])
})

test('cadastros críticos definem o campo inicial de foco pelo nome estável', () => {
  const crm = read('src/features/crm/LeadFormModal.tsx')
  const clients = read('src/modules/clients/pages/ClientsPage.tsx')
  assert.match(crm, /initialFocusSelector="input\[name=\'name\'\]"/)
  assert.match(clients, /initialFocusSelector="input\[name=\'name\'\]"/)
})

test('WhatsApp oferece exatamente dois canais locais sem exportar dados', () => {
  const store = read('src/lib/whatsappBusinessStore.ts')
  const crm = read('src/modules/crm/pages/CrmPage.tsx')
  const page = read('src/modules/marketing/pages/WhatsAppPage.tsx')
  const campaigns = read('src/modules/crm/pages/ContactCampaignsPage.tsx')
  assert.match(store, /channel-1/)
  assert.match(store, /channel-2/)
  assert.match(store, /whatsapp_channel_assignments/)
  assert.match(store, /assignContact/)
  assert.match(store, /businessAccountId/)
  assert.match(store, /phoneNumberId/)
  assert.match(store, /validateWhatsAppChannels/)
  assert.match(page, /warnings\[item\.id\]/)
  assert.match(crm, /whatsappChannelId/)
  assert.match(page, /Canal de saída/)
  assert.match(campaigns, /whatsappChannelId/)
  assert.doesNotMatch(store, /apiKey|accessToken/)
  assert.doesNotMatch(page, /fetch\(/)
})
