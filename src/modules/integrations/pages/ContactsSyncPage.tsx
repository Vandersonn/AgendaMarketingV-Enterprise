import { useMemo, useState } from 'react'
import { AddressBook, Download, RefreshCw, Upload } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCloudProvidersStore } from '../../../lib/cloudProvidersStore'
import { useCrmStore } from '../../../lib/crmStore'
import { buildContactSyncPlan, collectLocalContacts, type GoogleContact } from '../../../lib/googleContactsSync'

export function ContactsSyncPage() {
  const { providers, connectGoogle } = useCloudProvidersStore()
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const addLead = useCrmStore((state) => state.addLead)
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([])
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const clientId = providers['google-drive'].googleClientId
  const localContacts = useMemo(() => collectLocalContacts(clients, leads), [clients, leads])
  const plan = useMemo(() => buildContactSyncPlan(googleContacts, localContacts), [googleContacts, localContacts])

  async function run(action: () => Promise<string>) {
    setRunning(true)
    setMessage('')
    setError('')
    try {
      setMessage(await action())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setRunning(false)
    }
  }

  async function loadGoogleContacts() {
    if (!clientId) throw new Error('Informe o Google OAuth Client ID em Cloud Connect.')
    if (!window.agendaDesktop) throw new Error('A sincronização de contatos está disponível no aplicativo desktop.')
    const result = await window.agendaDesktop.listGoogleContacts(clientId)
    setGoogleContacts(result.contacts)
    return `${result.contacts.length} contato(s) carregado(s) do Google.`
  }

  async function reconnect() {
    if (!clientId) throw new Error('Informe o Google OAuth Client ID em Cloud Connect.')
    await connectGoogle()
    return 'Google conectado com permissão para contatos. Agora clique em Analisar contatos.'
  }

  async function importGoogleOnly() {
    plan.googleOnly.forEach((contact) => addLead({
      name: contact.name || contact.email || contact.phone,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      whatsapp: contact.phone,
      source: 'Google Contatos',
      stage: 'new',
      value: 0,
      owner: '',
      nextAction: 'Revisar contato importado',
      consentStatus: 'unknown'
    }))
    const count = plan.googleOnly.length
    await loadGoogleContacts()
    return `${count} contato(s) importado(s) como Lead. Revise o consentimento antes de enviar mensagens.`
  }

  async function exportLocalOnly() {
    if (!window.agendaDesktop) throw new Error('A exportação está disponível no aplicativo desktop.')
    let exported = 0
    for (const contact of plan.localOnly) {
      await window.agendaDesktop.createGoogleContact({ clientId, contact })
      exported += 1
    }
    await loadGoogleContacts()
    return `${exported} contato(s) exportado(s) para o Google.`
  }

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">CONTATOS CONECTADOS</span>
        <h1>Google, celular, WhatsApp e Telegram</h1>
        <p>Google Contatos funciona como central. O celular recebe os contatos pela conta Google.</p>
      </div>
      <Button variant="secondary" onClick={() => run(reconnect)} disabled={running}><AddressBook size={17}/> Conectar Google Contatos</Button>
    </header>

    {message && <div className="form-message success">{message}</div>}
    {error && <div className="form-message">{error}</div>}

    <section className="metrics-grid">
      <article className="metric-card"><span>Google</span><strong>{googleContacts.length}</strong><small>contatos encontrados</small></article>
      <article className="metric-card"><span>Novos no Google</span><strong>{plan.googleOnly.length}</strong><small>prontos para importar</small></article>
      <article className="metric-card"><span>Novos no sistema</span><strong>{plan.localOnly.length}</strong><small>prontos para exportar</small></article>
      <article className="metric-card"><span>Correspondências</span><strong>{plan.matched.length}</strong><small>telefone ou e-mail iguais</small></article>
    </section>

    <article className="panel-card">
      <div className="panel-header">
        <div><h2>Revisão da sincronização</h2><p>Nenhuma exclusão é executada. Duplicidades são comparadas por telefone e e-mail normalizados.</p></div>
        <Button onClick={() => run(loadGoogleContacts)} disabled={running || !clientId}><RefreshCw size={17}/> Analisar contatos</Button>
      </div>
      <div className="cloud-provider-actions">
        <Button onClick={() => run(importGoogleOnly)} disabled={running || !plan.googleOnly.length}><Download size={17}/> Importar novos como Leads</Button>
        <Button variant="secondary" onClick={() => run(exportLocalOnly)} disabled={running || !plan.localOnly.length}><Upload size={17}/> Exportar novos para Google</Button>
      </div>
    </article>

    <section className="integration-grid">
      {plan.googleOnly.slice(0, 50).map((contact) => <article className="panel-card integration-card" key={contact.resourceName}>
        <span className="eyebrow">IMPORTAR</span><h2>{contact.name || 'Sem nome'}</h2><p>{contact.company || 'Contato Google'}</p><small>{contact.email || contact.phone}</small>
      </article>)}
      {plan.localOnly.slice(0, 50).map((contact) => <article className="panel-card integration-card" key={`${contact.type}-${contact.id}`}>
        <span className="eyebrow">EXPORTAR</span><h2>{contact.name}</h2><p>{contact.company || (contact.type === 'client' ? 'Cliente' : 'Lead')}</p><small>{contact.email || contact.phone}</small>
      </article>)}
    </section>

    <article className="panel-card cloud-security-note">
      <AddressBook/><div><strong>WhatsApp e Telegram</strong><p>O sistema usa o telefone sincronizado para os canais. A agenda pessoal do WhatsApp não é importada e o Telegram só fornece contatos compartilhados com autorização.</p></div>
    </article>
  </div>
}
