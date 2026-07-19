import { useMemo, useState } from 'react'
import {
  Activity, CheckCircle2, CloudCog, Play, Plus, RefreshCcw,
  ShieldCheck, Trash2, WifiOff, XCircle
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import {
  useIntegrationHubStore,
  type IntegrationConnection,
  type IntegrationProvider
} from '../../../lib/integrationHubStore'

const providerLabels: Record<IntegrationProvider, string> = {
  openai: 'OpenAI',
  whatsapp: 'WhatsApp Cloud API',
  meta: 'Meta / Instagram',
  google: 'Google',
  wordpress: 'WordPress',
  canva: 'Canva',
  n8n: 'n8n',
  make: 'Make',
  custom: 'Integração personalizada'
}

export function IntegrationHubPage() {
  const {
    connections, jobs, addConnection, removeConnection, toggleConnection,
    testConnection, enqueueJob, processJob, clearFinishedJobs
  } = useIntegrationHubStore()

  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [payloadOpen, setPayloadOpen] = useState<string | null>(null)
  const [payload, setPayload] = useState('{"message":"Teste do AgendaMarketingV"}')
  const [form, setForm] = useState({
    provider: 'custom' as IntegrationProvider,
    name: '',
    endpoint: '',
    authType: 'none' as IntegrationConnection['authType'],
    enabled: true,
    timeoutSeconds: 15
  })

  const summary = useMemo(() => ({
    connected: connections.filter((item) => item.status === 'connected').length,
    errors: connections.filter((item) => item.status === 'error').length,
    queued: jobs.filter((item) => item.status === 'queued').length,
    failed: jobs.filter((item) => item.status === 'failed').length
  }), [connections, jobs])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    try {
      addConnection(form)
      setOpen(false)
      setMessage('Integração configurada sem armazenar segredos no desktop.')
      setForm({
        provider: 'custom', name: '', endpoint: '', authType: 'none',
        enabled: true, timeoutSeconds: 15
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  async function test(id: string) {
    setMessage(await testConnection(id))
  }

  function queue(id: string) {
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>
      enqueueJob(id, 'manual.test', parsed)
      setPayloadOpen(null)
      setMessage('Tarefa adicionada à fila.')
    } catch {
      setMessage('O payload precisa ser um JSON válido.')
    }
  }

  async function runJob(id: string) {
    setMessage(await processJob(id))
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">INTEGRAÇÕES SEGURAS</span>
          <h1>Hub de conexões</h1>
          <p>Configure endpoints HTTPS públicos. Tokens e chaves devem permanecer no backend.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nova conexão</Button>
      </header>

      {message && <div className="form-message success">{message}</div>}

      <section className="crm-summary">
        <article className="panel-card compact-card"><span>Conectadas</span><strong>{summary.connected}</strong></article>
        <article className="panel-card compact-card"><span>Com erro</span><strong>{summary.errors}</strong></article>
        <article className="panel-card compact-card"><span>Na fila</span><strong>{summary.queued}</strong></article>
        <article className="panel-card compact-card"><span>Jobs com falha</span><strong>{summary.failed}</strong></article>
      </section>

      <section className="integration-hub-grid">
        {connections.map((connection) => (
          <article key={connection.id} className={`panel-card connection-card status-${connection.status}`}>
            <div className="connection-head">
              <div className="connection-icon"><CloudCog /></div>
              <div>
                <span>{providerLabels[connection.provider]}</span>
                <h2>{connection.name}</h2>
              </div>
              <button type="button" className="icon-danger" onClick={() => removeConnection(connection.id)}><Trash2 size={17} /></button>
            </div>

            <div className="connection-status">
              {connection.status === 'connected' ? <CheckCircle2 />
                : connection.status === 'error' ? <XCircle />
                : connection.status === 'configured' ? <Activity />
                : <WifiOff />}
              <span>{connection.status}</span>
            </div>

            <div className="connection-details">
              <span>Endpoint</span>
              <strong>{connection.endpoint || 'Não configurado'}</strong>
            </div>
            <div className="connection-details">
              <span>Autenticação</span>
              <strong>{connection.authType}</strong>
            </div>
            <div className="connection-details">
              <span>Último teste</span>
              <strong>{connection.lastTestAt ? new Date(connection.lastTestAt).toLocaleString('pt-BR') : 'Nunca'}</strong>
            </div>

            {connection.lastError && <div className="connection-error">{connection.lastError}</div>}

            <div className="connection-actions">
              <Button variant="secondary" onClick={() => test(connection.id)}><RefreshCcw size={16} /> Testar</Button>
              <Button variant="secondary" onClick={() => setPayloadOpen(connection.id)}><Play size={16} /> Colocar na fila</Button>
              <button type="button" className={`connection-toggle ${connection.enabled ? 'active' : ''}`} onClick={() => toggleConnection(connection.id)}>
                {connection.enabled ? 'Ativa' : 'Inativa'}
              </button>
            </div>
          </article>
        ))}

        {!connections.length && (
          <article className="panel-card empty-panel">
            <ShieldCheck size={36} />
            <strong>Nenhuma integração configurada</strong>
            <span>Crie conexões com n8n, Make, OpenAI, Meta ou APIs próprias.</span>
          </article>
        )}
      </section>

      <article className="panel-card sync-queue-card">
        <div className="panel-header">
          <div><h2>Fila de sincronização</h2><p>Execuções manuais e falhas de integração.</p></div>
          <Button variant="secondary" onClick={clearFinishedJobs} disabled={!jobs.some((item) => ['success','failed'].includes(item.status))}>
            Limpar concluídos
          </Button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Ação</th><th>Integração</th><th>Status</th><th>Tentativas</th><th>Atualização</th><th>Ações</th></tr></thead>
            <tbody>
              {jobs.map((job) => {
                const connection = connections.find((item) => item.id === job.integrationId)
                return (
                  <tr key={job.id}>
                    <td><strong>{job.action}</strong><small>{job.lastError}</small></td>
                    <td>{connection?.name || 'Removida'}</td>
                    <td><span className={`sync-status ${job.status}`}>{job.status}</span></td>
                    <td>{job.attempts}</td>
                    <td>{new Date(job.updatedAt).toLocaleString('pt-BR')}</td>
                    <td><Button variant="secondary" onClick={() => runJob(job.id)} disabled={job.status === 'running'}><Play size={15} /> Executar</Button></td>
                  </tr>
                )
              })}
              {!jobs.length && <tr><td colSpan={6} className="empty-inline">Nenhum job na fila.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>

      <Modal title="Nova conexão" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label>Provedor
            <select value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value as IntegrationProvider }))}>
              {Object.entries(providerLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label>Nome<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className="full">Endpoint seguro<input type="url" value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} placeholder="https://..." required /></label>
          <label>Autenticação
            <select value={form.authType} onChange={(event) => setForm((current) => ({ ...current, authType: event.target.value as IntegrationConnection['authType'] }))}>
              <option value="none">Sem autenticação</option>
              <option value="oauth">OAuth via backend seguro</option>
            </select>
          </label>
          <label>Timeout<input type="number" min="3" max="120" value={form.timeoutSeconds} onChange={(event) => setForm((current) => ({ ...current, timeoutSeconds: Number(event.target.value) }))} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} /> Ativar conexão</label>
          <Button className="full">Salvar conexão</Button>
        </form>
      </Modal>

      <Modal title="Adicionar tarefa de teste" open={Boolean(payloadOpen)} onClose={() => setPayloadOpen(null)}>
        <div className="form-grid">
          <label className="full">Conteúdo JSON<textarea value={payload} onChange={(event) => setPayload(event.target.value)} /></label>
          <Button className="full" onClick={() => payloadOpen && queue(payloadOpen)}>Incluir na fila</Button>
        </div>
      </Modal>
    </div>
  )
}
