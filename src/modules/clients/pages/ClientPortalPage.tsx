import { useMemo, useState } from 'react'
import { CheckCircle2, Copy, ExternalLink, KeyRound, Plus, Power, TicketCheck } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useClientPortalStore } from '../../../lib/clientPortalStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useDocumentsStore } from '../../../lib/documentsStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { useMarketingStore } from '../../../lib/marketingStore'

export function ClientPortalPage() {
  const clients = useCrmStore((state) => state.clients)
  const documents = useDocumentsStore((state) => state.documents)
  const contracts = useContractsStore((state) => state.contracts)
  const finance = useFinanceStore((state) => state.entries)
  const contents = useMarketingStore((state) => state.contents)
  const { accesses, requests, createAccess, toggleAccess, addRequest, setRequestStatus } = useClientPortalStore()
  const [selectedId, setSelectedId] = useState(clients[0]?.id ?? '')
  const [requestOpen, setRequestOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [request, setRequest] = useState({ title: '', description: '', priority: 'medium' as const })

  const selected = clients.find((item) => item.id === selectedId)
  const access = accesses.find((item) => item.clientId === selectedId)
  const clientRequests = requests.filter((item) => item.clientId === selectedId)

  const summary = useMemo(() => ({
    docs: documents.filter((item) => item.clientId === selectedId).length,
    contracts: contracts.filter((item) => item.clientId === selectedId).length,
    pendingInvoices: finance.filter((item) => item.clientId === selectedId && item.type === 'income' && item.status !== 'paid').length,
    contents: contents.filter((item) => item.clientId === selectedId).length
  }), [selectedId, documents, contracts, finance, contents])

  function generateAccess() {
    if (!selectedId) return
    const result = createAccess(selectedId)
    setMessage(`Acesso criado. Código: ${result.accessCode}`)
  }

  function copyCode() {
    if (!access) return
    navigator.clipboard.writeText(access.accessCode)
    setMessage('Código copiado.')
  }

  function submitRequest(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedId) return
    addRequest({ ...request, clientId: selectedId })
    setRequestOpen(false)
    setRequest({ title: '', description: '', priority: 'medium' })
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">PORTAL DO CLIENTE</span><h1>Área externa do cliente</h1><p>Controle acessos, solicitações e visão resumida dos serviços.</p></div>
    </header>

    {message && <div className="form-message success">{message}</div>}

    <section className="portal-layout">
      <aside className="panel-card portal-client-list">
        <h2>Clientes</h2>
        {clients.map((client) => <button type="button" key={client.id} className={selectedId === client.id ? 'active' : ''} onClick={() => setSelectedId(client.id)}>
          <div className="avatar">{client.name.slice(0,2).toUpperCase()}</div>
          <div><strong>{client.name}</strong><span>{client.company || client.email}</span></div>
        </button>)}
      </aside>

      <div className="portal-main">
        {!selected ? <article className="panel-card empty-panel"><strong>Selecione um cliente</strong></article> : <>
          <article className="panel-card portal-access-card">
            <div>
              <span className="eyebrow">ACESSO DO PORTAL</span>
              <h2>{selected.name}</h2>
              <p>{selected.email}</p>
            </div>
            {!access ? <Button onClick={generateAccess}><KeyRound size={17}/> Gerar acesso</Button> : <div className="portal-code">
              <div><span>Código de acesso</span><strong>{access.accessCode}</strong></div>
              <Button variant="secondary" onClick={copyCode}><Copy size={16}/> Copiar</Button>
              <button type="button" className={`portal-power ${access.active ? 'active' : ''}`} onClick={() => toggleAccess(access.id)}><Power size={18}/></button>
            </div>}
          </article>

          <section className="portal-metrics">
            <article className="panel-card"><span>Documentos</span><strong>{summary.docs}</strong></article>
            <article className="panel-card"><span>Contratos</span><strong>{summary.contracts}</strong></article>
            <article className="panel-card"><span>Cobranças pendentes</span><strong>{summary.pendingInvoices}</strong></article>
            <article className="panel-card"><span>Conteúdos</span><strong>{summary.contents}</strong></article>
          </section>

          <article className="panel-card">
            <div className="panel-header">
              <div><h2>Solicitações do cliente</h2><p>Pedidos, alterações e demandas registradas.</p></div>
              <Button onClick={() => setRequestOpen(true)}><Plus size={17}/> Nova solicitação</Button>
            </div>
            <div className="portal-requests">
              {clientRequests.map((item) => <div key={item.id}>
                <div><strong>{item.title}</strong><span>{item.priority} • {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span><p>{item.description}</p></div>
                <select value={item.status} onChange={(event) => setRequestStatus(item.id, event.target.value as typeof item.status)}>
                  <option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="completed">Concluída</option>
                </select>
              </div>)}
              {!clientRequests.length && <div className="empty-inline">Nenhuma solicitação registrada.</div>}
            </div>
          </article>
        </>}
      </div>
    </section>

    <Modal title="Nova solicitação" open={requestOpen} onClose={() => setRequestOpen(false)}>
      <form className="form-grid" onSubmit={submitRequest}>
        <label className="full">Título<input value={request.title} onChange={(event) => setRequest({ ...request, title: event.target.value })} required /></label>
        <label>Prioridade<select value={request.priority} onChange={(event) => setRequest({ ...request, priority: event.target.value as typeof request.priority })}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></label>
        <label className="full">Descrição<textarea value={request.description} onChange={(event) => setRequest({ ...request, description: event.target.value })} /></label>
        <Button className="full">Registrar solicitação</Button>
      </form>
    </Modal>
  </div>
}
