import { useMemo, useRef, useState } from 'react'
import {
  Ban, CheckCircle2, Clipboard, Download, FileKey2, KeyRound,
  LockKeyhole, Plus, RefreshCw, Search, ShieldCheck, Trash2, Upload
} from 'lucide-react'
import { Button } from '../../../components/Button'
import {
  LICENSE_OWNER_EMAIL,
  useLicenseAuthorityStore,
  type AuthorityLicense
} from '../../../lib/licenseAuthorityStore'
import type { LicensePlan } from '../../../lib/licenseStore'

const planLabels: Record<LicensePlan, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise'
}

function defaultExpiry(plan: LicensePlan): string {
  const date = new Date()
  if (plan === 'free') date.setDate(date.getDate() + 30)
  if (plan === 'pro') date.setFullYear(date.getFullYear() + 1)
  if (plan === 'enterprise') date.setFullYear(date.getFullYear() + 2)
  return date.toISOString().slice(0, 10)
}

export function LicenseAuthorityPage() {
  const {
    initialized, licenses, session, setupPassword, unlock, lock,
    generate, revoke, restore, remove, importRegistry
  } = useLicenseAuthorityStore()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | AuthorityLicense['status']>('all')
  const importRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    plan: 'pro' as LicensePlan,
    customerName: '',
    customerEmail: '',
    companyName: '',
    cnpj: '',
    maxDevices: 1,
    expiresAt: defaultExpiry('pro'),
    notes: ''
  })

  const filtered = useMemo(() => licenses
    .filter((item) => status === 'all' || item.status === status)
    .filter((item) => `${item.key} ${item.customerName} ${item.customerEmail} ${item.companyName} ${item.cnpj}`.toLowerCase().includes(query.toLowerCase())),
  [licenses, query, status])

  async function setup(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    const result = await setupPassword(password)
    if (!result.ok) setError(result.message)
    else {
      setMessage(result.message)
      setPassword('')
      setConfirmPassword('')
    }
  }

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const result = await unlock(password)
    if (!result.ok) setError(result.message)
    else {
      setMessage(result.message)
      setPassword('')
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const license = await generate(form)
      setMessage(`Chave ${license.key} gerada com sucesso.`)
      setForm({
        plan: 'pro',
        customerName: '',
        customerEmail: '',
        companyName: '',
        cnpj: '',
        maxDevices: 1,
        expiresAt: defaultExpiry('pro'),
        notes: ''
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copiado.`)
  }

  function downloadCertificate(license: AuthorityLicense) {
    const payload = {
      application: 'AgendaMarketingV',
      issuer: 'DEVVANDERSONAPPS',
      developer: 'Vanderson de Castro',
      license: {
        key: license.key,
        certificate: license.certificate,
        plan: license.plan,
        customerName: license.customerName,
        customerEmail: license.customerEmail,
        companyName: license.companyName,
        cnpj: license.cnpj,
        maxDevices: license.maxDevices,
        issuedAt: license.issuedAt,
        expiresAt: license.expiresAt
      }
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${license.key}.amvlicense.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportRegistry() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      issuer: 'DEVVANDERSONAPPS',
      licenses
    }, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'AgendaMarketingV-registro-licencas.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file?: File) {
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      const incoming = Array.isArray(payload) ? payload : payload.licenses
      if (!Array.isArray(incoming)) throw new Error('Registro inválido.')
      importRegistry(incoming)
      setMessage(`${incoming.length} licença(s) importada(s).`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  if (!initialized) {
    return <div className="page owner-lock-page">
      <article className="panel-card owner-lock-card">
        <ShieldCheck size={48}/>
        <span className="eyebrow">PRIMEIRO ACESSO DO PROPRIETÁRIO</span>
        <h1>Configure a senha-mestra</h1>
        <p>Esta área só aparece para <strong>{LICENSE_OWNER_EMAIL}</strong>. A senha-mestra será exigida para gerar ou administrar licenças.</p>
        {error && <div className="form-message">{error}</div>}
        <form className="form-grid" onSubmit={setup}>
          <label className="full">Nova senha-mestra<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required/></label>
          <label className="full">Confirmar senha<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required/></label>
          <Button className="full"><KeyRound size={17}/> Criar autoridade de licenças</Button>
        </form>
      </article>
    </div>
  }

  if (!session.unlocked) {
    return <div className="page owner-lock-page">
      <article className="panel-card owner-lock-card">
        <LockKeyhole size={48}/>
        <span className="eyebrow">ACESSO RESTRITO</span>
        <h1>Autoridade de licenças bloqueada</h1>
        <p>Entre com a senha-mestra do proprietário.</p>
        {error && <div className="form-message">{error}</div>}
        <form className="form-grid" onSubmit={login}>
          <label className="full">Senha-mestra<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label>
          <Button className="full"><ShieldCheck size={17}/> Desbloquear</Button>
        </form>
      </article>
    </div>
  }

  const active = licenses.filter((item) => item.status === 'active').length
  const revoked = licenses.filter((item) => item.status === 'revoked').length
  const expiring = licenses.filter((item) => item.status !== 'revoked' && new Date(item.expiresAt).getTime() < Date.now() + 30 * 86400000).length

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">DEVVANDERSONAPPS — ÁREA DO PROPRIETÁRIO</span>
        <h1>Autoridade de licenças</h1>
        <p>Geração e administração exclusiva de chaves do AgendaMarketingV.</p>
      </div>
      <div className="actions">
        <input ref={importRef} hidden type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0])}/>
        <Button variant="secondary" onClick={() => importRef.current?.click()}><Upload size={17}/> Importar registro</Button>
        <Button variant="secondary" onClick={exportRegistry}><Download size={17}/> Exportar registro</Button>
        <Button variant="danger" onClick={lock}><LockKeyhole size={17}/> Bloquear</Button>
      </div>
    </header>

    {message && <div className="form-message success">{message}</div>}
    {error && <div className="form-message">{error}</div>}

    <section className="license-authority-summary">
      <article className="panel-card"><FileKey2/><span>Total gerado</span><strong>{licenses.length}</strong></article>
      <article className="panel-card"><CheckCircle2/><span>Ativas</span><strong>{active}</strong></article>
      <article className="panel-card"><Ban/><span>Revogadas</span><strong>{revoked}</strong></article>
      <article className="panel-card"><RefreshCw/><span>Vencendo em 30 dias</span><strong>{expiring}</strong></article>
    </section>

    <section className="license-authority-main">
      <article className="panel-card">
        <div className="panel-header"><div><h2>Gerar nova chave</h2><p>Cadastre o cliente e defina as regras da licença.</p></div><Plus/></div>
        <form className="form-grid" onSubmit={submit}>
          <label>Plano
            <select value={form.plan} onChange={(event) => {
              const plan = event.target.value as LicensePlan
              setForm((current) => ({ ...current, plan, expiresAt: defaultExpiry(plan) }))
            }}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <label>Validade<input type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} required/></label>
          <label>Cliente<input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} required/></label>
          <label>E-mail<input type="email" value={form.customerEmail} onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))} required/></label>
          <label>Empresa<input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}/></label>
          <label>CNPJ<input value={form.cnpj} onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}/></label>
          <label>Máximo de dispositivos<input type="number" min={1} max={1000} value={form.maxDevices} onChange={(event) => setForm((current) => ({ ...current, maxDevices: Number(event.target.value) }))}/></label>
          <label className="full">Observações<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}/></label>
          <Button className="full"><KeyRound size={17}/> Gerar chave e certificado</Button>
        </form>
      </article>

      <article className="panel-card authority-security-card">
        <ShieldCheck/>
        <h2>Controle exclusivo</h2>
        <p>A rota é liberada apenas para o e-mail do proprietário e exige uma segunda senha-mestra.</p>
        <div><span>Proprietário</span><strong>Vanderson de Castro</strong></div>
        <div><span>E-mail autorizado</span><strong>{LICENSE_OWNER_EMAIL}</strong></div>
        <div><span>Emissor</span><strong>DEVVANDERSONAPPS</strong></div>
        <div><span>CNPJ</span><strong>39.551.372/0001-41</strong></div>
      </article>
    </section>

    <div className="app-center-toolbar">
      <div className="search-box"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar chave, cliente ou empresa..."/></div>
      <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
        <option value="all">Todos os status</option>
        <option value="available">Disponíveis</option>
        <option value="active">Ativas</option>
        <option value="revoked">Revogadas</option>
        <option value="expired">Expiradas</option>
      </select>
    </div>

    <section className="authority-license-list">
      {filtered.map((license) => <article key={license.id} className={`panel-card authority-license status-${license.status}`}>
        <div className="authority-license-head">
          <div><span>{planLabels[license.plan]} • {license.status}</span><h2>{license.key}</h2><p>{license.customerName} • {license.customerEmail}</p></div>
          <div className="authority-license-validity"><span>Válida até</span><strong>{new Date(`${license.expiresAt}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>
        </div>
        <div className="authority-license-data">
          <div><span>Empresa</span><strong>{license.companyName || '—'}</strong></div>
          <div><span>CNPJ</span><strong>{license.cnpj || '—'}</strong></div>
          <div><span>Dispositivos</span><strong>{license.maxDevices}</strong></div>
          <div><span>Emissão</span><strong>{new Date(license.issuedAt).toLocaleDateString('pt-BR')}</strong></div>
        </div>
        <div className="authority-license-actions">
          <Button variant="secondary" onClick={() => copy(license.key, 'Chave')}><Clipboard size={16}/> Copiar chave</Button>
          <Button variant="secondary" onClick={() => copy(license.certificate, 'Certificado')}><Clipboard size={16}/> Copiar certificado</Button>
          <Button variant="secondary" onClick={() => downloadCertificate(license)}><Download size={16}/> Certificado</Button>
          {license.status === 'revoked'
            ? <Button onClick={() => restore(license.id)}><RefreshCw size={16}/> Restaurar</Button>
            : <Button variant="danger" onClick={() => revoke(license.id)}><Ban size={16}/> Revogar</Button>
          }
          <button type="button" className="icon-danger" onClick={() => remove(license.id)}><Trash2 size={17}/></button>
        </div>
      </article>)}
      {!filtered.length && <article className="panel-card empty-panel"><strong>Nenhuma licença encontrada.</strong></article>}
    </section>
  </div>
}
