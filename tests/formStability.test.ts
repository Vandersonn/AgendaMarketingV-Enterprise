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


test('WhatsApp contacts validate availability before recording activity', () => {
  const crmPage = readFileSync(join(process.cwd(), 'src/modules/crm/pages/CrmPage.tsx'), 'utf8')
  const campaignsPage = readFileSync(join(process.cwd(), 'src/modules/crm/pages/ContactCampaignsPage.tsx'), 'utf8')
  const whatsappPage = readFileSync(join(process.cwd(), 'src/modules/marketing/pages/WhatsAppPage.tsx'), 'utf8')
  assert.match(crmPage, /Este Lead não possui WhatsApp ou telefone/)
  assert.ok(crmPage.indexOf("if (type === 'whatsapp')") < crmPage.indexOf('if (registerActivity)'))
  assert.match(crmPage, /whatsappChannel\.enabled/)
  assert.match(crmPage, /assignWhatsAppContact/)
  assert.match(campaignsPage, /canal de WhatsApp desta campanha está desativado/)
  assert.match(whatsappPage, /canal selecionado está desativado/)
})


test('autenticação não distribui credenciais padrão', () => {
  const authStore = read('src/lib/authStore.ts')
  const authPage = read('src/modules/auth/pages/AuthPage.tsx')
  assert.doesNotMatch(authStore, /password:\s*['"]123456['"]/)
  assert.doesNotMatch(authStore, /users\.unshift\(owner\)/)
  assert.doesNotMatch(authPage, /useState\(['"]123456['"]\)/)
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
  assert.match(main, /google:contacts:update/)
  assert.match(page, /buildContactSyncPlan/)
  assert.match(page, /useGoogleForConflicts/)
  assert.match(page, /useSystemForConflicts/)
  assert.match(page, /loadContactBindings/)
  assert.match(page, /saveContactBindings/)
  assert.doesNotMatch(page, /deleteGoogleContact/)
})


test('backend do WhatsApp exige organização, consentimento e segredos do servidor', () => {
  const migration = read('supabase/migrations/202607190004_whatsapp_business_backend.sql')
  const backend = read('supabase/functions/whatsapp-send/index.ts')
  const frontend = read('src/lib/whatsappBusinessStore.ts')
  assert.match(migration, /channel_key in \('channel-1', 'channel-2'\)/)
  assert.match(migration, /contact_communication_consents/)
  assert.match(migration, /whatsapp_message_deliveries/)
  assert.match(backend, /auth\.getUser\(\)/)
  assert.match(backend, /organization_members/)
  assert.match(backend, /Consentimento ativo não encontrado/)
  assert.match(backend, /WHATSAPP_ACCESS_TOKEN_CHANNEL_1/)
  assert.match(backend, /WHATSAPP_ACCESS_TOKEN_CHANNEL_2/)
  assert.match(backend, /META_GRAPH_API_VERSION/)
  assert.doesNotMatch(migration, /access_token\s+text/)
  assert.doesNotMatch(frontend, /WHATSAPP_ACCESS_TOKEN|accessToken/)
})


test('webhook do WhatsApp valida assinatura e processa eventos idempotentes', () => {
  const migration = read('supabase/migrations/202607190005_whatsapp_webhook.sql')
  const webhook = read('supabase/functions/whatsapp-webhook/index.ts')
  assert.match(migration, /provider_message_id text not null unique/)
  assert.match(migration, /members read whatsapp inbound messages/)
  assert.match(webhook, /META_WEBHOOK_VERIFY_TOKEN/)
  assert.match(webhook, /META_APP_SECRET/)
  assert.match(webhook, /x-hub-signature-256/)
  assert.match(webhook, /HMAC/)
  assert.match(webhook, /constantTimeEqual/)
  assert.match(webhook, /ignoreDuplicates: true/)
  assert.match(webhook, /whatsapp_message_deliveries/)
  assert.match(webhook, /whatsapp_inbound_messages/)
  assert.ok(webhook.indexOf('constantTimeEqual(supplied, expected)') < webhook.indexOf("JSON.parse(rawBody)"))
})


test('sincronização do celular usa vCard sem presumir consentimento', () => {
  const parser = read('src/lib/vCardContacts.ts')
  const page = read('src/modules/integrations/pages/ContactsSyncPage.tsx')
  assert.match(parser, /parseVCardContacts/)
  assert.match(parser, /newVCardContacts/)
  assert.match(parser, /createVCard/)
  assert.match(page, /accept=".vcf,text\/vcard,text\/x-vcard"/)
  assert.match(page, /Agenda do celular \(vCard\)/)
  assert.match(page, /consentStatus: 'unknown'/)
  assert.match(page, /10 \* 1024 \* 1024/)
  assert.doesNotMatch(page, /deletePhoneContact|navigator\.contacts/)
})


test('integrações não persistem segredos e Google exige armazenamento criptografado', () => {
  const hub = read('src/lib/integrationHubStore.ts')
  const hubPage = read('src/modules/integrations/pages/IntegrationHubPage.tsx')
  const integrations = read('src/modules/integrations/pages/IntegrationsPage.tsx')
  const cloudPage = read('src/modules/integrations/pages/CloudConnectPage.tsx')
  const electron = read('electron/main.cjs')
  assert.match(hub, /validatePublicHttpsUrl/)
  assert.match(hub, /apiKey: ''/)
  assert.doesNotMatch(hubPage, /Token ou chave|Bearer Token|X-API-Key/)
  assert.doesNotMatch(integrations, /key: 'whatsappWebhook'/)
  assert.match(integrations, /whatsappWebhook: ''/)
  assert.match(electron, /Armazenamento seguro indisponível/)
  assert.doesNotMatch(electron, /Buffer\.from\(value, 'utf8'\)/)
  assert.match(cloudPage, /DRIVE E PEOPLE API/)
  assert.match(cloudPage, /Lista de arquivos atualizada/)
})


test('central de sincronização não simula transmissão de dados', () => {
  const page = read('src/modules/integrations/pages/CloudSyncPage.tsx')
  assert.match(page, /Sem sincronização simulada/)
  assert.match(page, /navigate\('\/cloud-connect'\)/)
  assert.match(page, /navigate\('\/contacts-sync'\)/)
  assert.doesNotMatch(page, /useCloudSyncStore|setEndpoint|enqueue\(|process\(/)
  assert.doesNotMatch(page, /api\.seudominio\.com/)
})
