import { useMemo, useState } from 'react'
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { StatusMessage } from '../../../components/StatusMessage'
import { useCrmStore } from '../../../lib/crmStore'
import { isValidBrazilianPhone, isValidCpfOrCnpj, isValidEmail, normalizeEmail, onlyDigits, samePersonKey } from '../../../lib/dataValidation'

const brazilianStates = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

export function ClientsPage() {
  const { clients, addClient, deleteClient, leads, activities, proposals, addActivity, addProposal } = useCrmStore()
  const [search, setSearch] = useState('')
  const [clientModal, setClientModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id ?? null)
  const [activityText, setActivityText] = useState('')
  const [proposal, setProposal] = useState({ title: '', value: 0, validUntil: '', description: '' })
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', city: '', state: '', document: '', notes: '' })
  const [discardClientOpen, setDiscardClientOpen] = useState(false)
  const [deleteClientOpen, setDeleteClientOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ message: string; tone: 'success' | 'warning' | 'error' | 'info' }>({ message: '', tone: 'info' })

  const filtered = useMemo(
    () => clients.filter((client) => `${client.name} ${client.company} ${client.email} ${client.city} ${client.state ?? ''}`.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  )
  const selected = clients.find((client) => client.id === selectedId) ?? null
  const clientActivities = activities.filter((activity) => activity.clientId === selectedId)
  const clientProposals = proposals.filter((item) => item.clientId === selectedId)

  function createClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const client = {
      ...form,
      name: String(fields.get('name') ?? form.name).trim(),
      company: String(fields.get('company') ?? form.company).trim(),
      email: String(fields.get('email') ?? form.email).trim(),
      phone: String(fields.get('phone') ?? form.phone).trim(),
      city: String(fields.get('city') ?? form.city).trim(),
      state: String(fields.get('state') ?? form.state).trim(),
      document: String(fields.get('document') ?? form.document).trim(),
      notes: String(fields.get('notes') ?? form.notes).trim()
    }

    if (!client.name) {
      setStatusMessage({ message: 'Informe o nome do cliente.', tone: 'warning' })
      return
    }
    if (!isValidEmail(client.email)) {
      setStatusMessage({ message: 'Informe um e-mail válido para o cliente.', tone: 'warning' })
      return
    }
    if (!isValidBrazilianPhone(client.phone)) {
      setStatusMessage({ message: 'Informe um telefone brasileiro válido com DDD.', tone: 'warning' })
      return
    }
    if (!isValidCpfOrCnpj(client.document)) {
      setStatusMessage({ message: 'Informe um CPF ou CNPJ válido.', tone: 'warning' })
      return
    }

    const duplicate = clients.find((item) => {
      const sameDocument = client.document && onlyDigits(item.document) === onlyDigits(client.document)
      const sameEmail = client.email && normalizeEmail(item.email) === normalizeEmail(client.email)
      const samePhone = client.phone && onlyDigits(item.phone) === onlyDigits(client.phone)
      const sameIdentity = samePersonKey(item.name, item.company) === samePersonKey(client.name, client.company)
      return Boolean(sameDocument || sameEmail || samePhone || sameIdentity)
    })
    if (duplicate) {
      setStatusMessage({ message: `Já existe um cliente semelhante: ${duplicate.name}${duplicate.company ? ` — ${duplicate.company}` : ''}.`, tone: 'warning' })
      return
    }

    addClient(client)
    setForm({ name: '', company: '', email: '', phone: '', city: '', state: '', document: '', notes: '' })
    setClientModal(false)
    setStatusMessage({ message: `Cliente ${client.name} salvo com sucesso.`, tone: 'success' })
  }

  const clientFormDirty = Object.values(form).some((value) => String(value).trim())
  useUnsavedChanges(clientModal && clientFormDirty)

  function requestCloseClientForm() {
    if (clientFormDirty) setDiscardClientOpen(true)
    else setClientModal(false)
  }

  function createActivity(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || !activityText.trim()) return
    addActivity({
      clientId: selected.id,
      type: 'note',
      title: 'Observação',
      description: activityText,
      date: new Date().toISOString()
    })
    setActivityText('')
  }

  function createProposal(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) return
    addProposal({
      clientId: selected.id,
      title: proposal.title,
      value: proposal.value,
      validUntil: proposal.validUntil,
      description: proposal.description,
      status: 'draft'
    })
    setProposal({ title: '', value: 0, validUntil: '', description: '' })
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">RELACIONAMENTO</span>
          <h1>Clientes</h1>
          <p>Cadastro completo, histórico e propostas comerciais.</p>
        </div>
        <Button onClick={() => { setStatusMessage({ message: '', tone: 'info' }); setClientModal(true) }}><Plus size={18} /> Novo cliente</Button>
      </header>

      {statusMessage.message && <StatusMessage message={statusMessage.message} tone={statusMessage.tone} />}

      <section className="clients-layout">
        <aside className="panel-card client-list-panel">
          <div className="search-box"><Search size={18} /><input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="client-list">
            {filtered.map((client) => (
              <button type="button" key={client.id} className={`client-list-item ${selectedId === client.id ? 'active' : ''}`} onClick={() => setSelectedId(client.id)}>
                <div className="avatar">{client.name.slice(0, 2).toUpperCase()}</div>
                <div><strong>{client.name}</strong><span>{client.company || client.email}</span></div>
              </button>
            ))}
          </div>
        </aside>

        <section className="client-detail">
          {!selected ? (
            <article className="panel-card empty-panel"><strong>Selecione um cliente</strong><span>Os detalhes aparecerão aqui.</span></article>
          ) : (
            <>
              <article className="panel-card client-profile">
                <div>
                  <span className="eyebrow">PERFIL DO CLIENTE</span>
                  <h2>{selected.name}</h2>
                  <p>{selected.company}</p>
                </div>
                <button type="button" className="icon-danger" aria-label={`Excluir cliente ${selected.name}`} onClick={() => setDeleteClientOpen(true)}><Trash2 size={18} /></button>
                <div className="client-data-grid">
                  <div><span>E-mail</span><strong>{selected.email || 'Não informado'}</strong></div>
                  <div><span>WhatsApp</span><strong>{selected.phone || 'Não informado'}</strong></div>
                  <div><span>Localização</span><strong>{selected.city ? `${selected.city}${selected.state ? `/${selected.state}` : ''}` : 'Não informada'}</strong></div>
                  <div><span>Oportunidades</span><strong>{leads.filter((lead) => lead.clientId === selected.id).length}</strong></div>
                </div>
                {selected.notes && <div className="client-notes">{selected.notes}</div>}
              </article>

              <div className="client-detail-grid">
                <article className="panel-card">
                  <div className="panel-header"><h2>Histórico</h2></div>
                  <form onSubmit={createActivity} className="inline-form">
                    <input value={activityText} onChange={(e) => setActivityText(e.target.value)} placeholder="Registrar observação..." />
                    <Button type="submit">Adicionar</Button>
                  </form>
                  <div className="timeline">
                    {clientActivities.map((activity) => (
                      <div key={activity.id}><span>{new Date(activity.date).toLocaleString('pt-BR')}</span><strong>{activity.title}</strong><p>{activity.description}</p></div>
                    ))}
                    {!clientActivities.length && <div className="empty-inline">Nenhum histórico registrado.</div>}
                  </div>
                </article>

                <article className="panel-card">
                  <div className="panel-header"><h2>Propostas</h2></div>
                  <form className="form-grid" onSubmit={createProposal}>
                    <label className="full">Título<input value={proposal.title} onChange={(e) => setProposal({ ...proposal, title: e.target.value })} required /></label>
                    <label>Valor<input type="number" value={proposal.value} onChange={(e) => setProposal({ ...proposal, value: Number(e.target.value) })} /></label>
                    <label>Validade<input type="date" value={proposal.validUntil} onChange={(e) => setProposal({ ...proposal, validUntil: e.target.value })} /></label>
                    <label className="full">Descrição<input value={proposal.description} onChange={(e) => setProposal({ ...proposal, description: e.target.value })} /></label>
                    <Button type="submit" className="full">Criar proposta</Button>
                  </form>
                  <div className="proposal-list">
                    {clientProposals.map((item) => (
                      <div key={item.id}><strong>{item.title}</strong><span>{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • {item.status}</span></div>
                    ))}
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      </section>


      <ConfirmDialog
        open={discardClientOpen}
        title="Descartar novo cliente?"
        message="Existem informações ainda não salvas. Ao sair, os dados preenchidos serão perdidos."
        confirmLabel="Descartar alterações"
        danger
        onClose={() => setDiscardClientOpen(false)}
        onConfirm={() => {
          setDiscardClientOpen(false)
          setClientModal(false)
          setForm({ name: '', company: '', email: '', phone: '', city: '', state: '', document: '', notes: '' })
        }}
      />

      <ConfirmDialog
        open={deleteClientOpen}
        title="Enviar cliente para a Lixeira"
        message={selected ? `Excluir ${selected.name}? O registro poderá ser restaurado pela Lixeira.` : ''}
        confirmLabel="Enviar para a Lixeira"
        danger
        onClose={() => setDeleteClientOpen(false)}
        onConfirm={() => {
          if (selected) deleteClient(selected.id)
          setSelectedId(null)
          setDeleteClientOpen(false)
          setStatusMessage({ message: 'Cliente enviado para a Lixeira.', tone: 'success' })
        }}
      />

      <Modal title="Novo cliente" open={clientModal} onClose={requestCloseClientForm} initialFocusSelector="input[name='name']">
        <form className="form-grid" onSubmit={createClient}>
          <label>Nome<input name="name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required /></label>
          <label>Empresa<input name="company" value={form.company} onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))} /></label>
          <label>E-mail<input name="email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} /></label>
          <label>WhatsApp<input name="phone" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} /></label>
          <label>Cidade<input name="city" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} /></label>
          <label>Estado
            <select name="state" value={form.state} onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))}>
              <option value="">Selecione</option>
              {brazilianStates.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label>CPF/CNPJ<input name="document" value={form.document} onChange={(e) => setForm((current) => ({ ...current, document: e.target.value }))} /></label>
          <label className="full">Observações<input name="notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} /></label>
          <Button type="submit" className="full">Salvar cliente</Button>
        </form>
      </Modal>
    </div>
  )
}
