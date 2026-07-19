import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, FileKey2, KeyRound, LockKeyhole, ShieldCheck, Sparkles, Upload } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useLicenseStore } from '../../../lib/licenseStore'
import { useOrganizationsStore } from '../../../lib/organizationsStore'
import { planFeatures } from '../../../lib/planFeatures'
import { validateOfflineCertificate } from '../../../lib/licenseAuthorityStore'

const planLabels = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }

export function LicenseCenterPage() {
  const { license, activate, activateIssued, startTrial, deactivate, validate } = useLicenseStore()
  const currentOrganizationId = useOrganizationsStore((state) => state.currentOrganizationId)
  const organizations = useOrganizationsStore((state) => state.organizations)
  const [key, setKey] = useState('')
  const [message, setMessage] = useState('')
  const [certificate, setCertificate] = useState('')
  const certificateFileRef = useRef<HTMLInputElement>(null)
  const organization = organizations.find((item) => item.id === currentOrganizationId)

  useEffect(() => { validate() }, [validate])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const result = activate(key, currentOrganizationId)
    setMessage(result.message)
    if (result.ok) setKey('')
  }


  async function activateCertificate() {
    const result = await validateOfflineCertificate(certificate)
    if (!result.ok || !result.data) {
      setMessage(result.message)
      return
    }
    const activation = activateIssued({
      key: result.data.key,
      plan: result.data.plan,
      expiresAt: new Date(`${result.data.expiresAt}T23:59:59`).toISOString(),
      organizationId: currentOrganizationId
    })
    setMessage(activation.message)
    if (activation.ok) setCertificate('')
  }

  async function readCertificateFile(file?: File) {
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      const value = payload?.license?.certificate ?? payload?.certificate ?? ''
      if (!value) throw new Error('Certificado não encontrado no arquivo.')
      setCertificate(value)
      setMessage('Certificado carregado. Clique em Ativar certificado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      if (certificateFileRef.current) certificateFileRef.current.value = ''
    }
  }

  const daysLeft = license.expiresAt ? Math.max(0, Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000)) : 0

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">LICENCIAMENTO</span><h1>Central de licença</h1><p>Ative planos e acompanhe validade, dispositivo e empresa.</p></div></header>
    {message && <div className="form-message success">{message}</div>}
    <section className="license-hero panel-card">
      <div className={`license-badge status-${license.status}`}><ShieldCheck/></div>
      <div><span className="eyebrow">PLANO ATUAL</span><h2>{planLabels[license.plan]}</h2><p>{organization?.name || 'Sem empresa'} • Status {license.status}</p></div>
      <div className="license-validity"><span>Dias restantes</span><strong>{daysLeft}</strong></div>
    </section>
    <section className="settings-grid">
      <article className="panel-card">
        <h2>Ativar licença</h2><p className="meta">Use uma chave válida vinculada ao ambiente atual.</p>
        <form className="form-grid" onSubmit={submit}><label className="full">Chave de licença<input value={key} onChange={(event) => setKey(event.target.value)} placeholder="AMV-PRO-XXXX-XXXX-XXXX" required/></label><Button className="full"><KeyRound size={17}/> Ativar chave local</Button></form>
        <div className="license-certificate-box">
          <div className="panel-header"><div><h3>Certificado offline</h3><p>Use o arquivo fornecido pela DEVVANDERSONAPPS.</p></div><FileKey2/></div>
          <textarea value={certificate} onChange={(event) => setCertificate(event.target.value)} placeholder="AMVCERT1..."/>
          <input ref={certificateFileRef} hidden type="file" accept=".json,.amvlicense" onChange={(event) => readCertificateFile(event.target.files?.[0])}/>
          <div className="license-certificate-actions">
            <Button variant="secondary" onClick={() => certificateFileRef.current?.click()}><Upload size={16}/> Carregar arquivo</Button>
            <Button onClick={activateCertificate} disabled={!certificate.trim()}><FileKey2 size={16}/> Ativar certificado</Button>
          </div>
        </div>
        <div className="license-secondary-actions"><Button variant="secondary" onClick={() => startTrial(currentOrganizationId)}><Sparkles size={17}/> Iniciar teste de 14 dias</Button><Button variant="danger" onClick={deactivate}><LockKeyhole size={17}/> Desativar</Button></div>
      </article>
      <article className="panel-card license-details"><h2>Detalhes</h2><div><span>Status</span><strong>{license.status}</strong></div><div><span>Empresa</span><strong>{organization?.name || '—'}</strong></div><div><span>Dispositivo</span><strong>{license.deviceId.slice(0,8)}…</strong></div><div><span>Ativação</span><strong>{license.activatedAt ? new Date(license.activatedAt).toLocaleString('pt-BR') : '—'}</strong></div><div><span>Expiração</span><strong>{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('pt-BR') : '—'}</strong></div></article>
    </section>
    <section className="license-plan-grid">
      {(['free','pro','enterprise'] as const).map((plan) => <article key={plan} className={`panel-card plan-card ${license.plan === plan ? 'current' : ''}`}><h2>{planLabels[plan]}</h2><div className="plan-feature-list">{planFeatures.map((feature) => <div key={feature.id} className={feature[plan] ? 'enabled' : 'disabled'}><CheckCircle2 size={15}/><span>{feature.label}</span></div>)}</div></article>)}
    </section>
  </div>
}
