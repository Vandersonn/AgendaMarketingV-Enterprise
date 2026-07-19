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

test('Electron restringe URLs e arquivos recebidos pelo renderer', () => {
  const main = read('electron/main.cjs')
  assert.match(main, /allowedExternalProtocols/)
  assert.match(main, /normalizeExternalUrl\(url\)/)
  assert.match(main, /assertAuthorizedCloudFile\(filePath\)/)
  assert.match(main, /will-navigate/)
  assert.doesNotMatch(main, /system:openExternal', \(_event, url\) => shell\.openExternal\(url\)/)
})

test('sincronização de contatos usa People API e revisão local', () => {
  const main = read('electron/main.cjs')
  const page = read('src/modules/integrations/pages/ContactsSyncPage.tsx')
  assert.match(main, /people\.googleapis\.com/)
  assert.match(main, /google:contacts:list/)
  assert.match(main, /google:contacts:create/)
  assert.match(page, /buildContactSyncPlan/)
  assert.doesNotMatch(page, /deleteGoogleContact/)
})
