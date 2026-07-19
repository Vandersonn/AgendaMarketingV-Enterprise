import { useMemo, useRef, useState } from 'react'
import {
  Ban, CheckCircle2, Download, History, Laptop, RefreshCw,
  Search, ShieldAlert, Smartphone, Trash2, Upload, UsersRound
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { useLicenseActivationStore } from '../../../lib/licenseActivationStore'
import { useLicenseAuthorityStore } from '../../../lib/licenseAuthorityStore'

export function LicensingControlPage() {
  const {
    licenses, renew, updateDeviceLimit, revoke, restore
  } = useLicenseAuthorityStore()
  const {
    activations, history, releaseDevice, blockDevice, restoreDevice,
    removeHistory, importData
  } = useLicenseActivationStore()

  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [message, setMessage] = useState('')
  const [renewDate, setRenewDate] = useState('')
  const [deviceLimit, setDeviceLimit] = useState(1)
  const importRef = useRef<HTMLInputElement>(null)

  const filteredLicenses = useMemo(() => licenses.filter((item) =>
    `${item.key} ${item.customerName} ${item.customerEmail} ${item.companyName}`.toLowerCase().includes(query.toLowerCase())
  ), [licenses, query])

  const selectedLicense = licenses.find((item) => item.key === selectedKey) ?? filteredLicenses[0]
  const selectedActivations = activations.filter((item) => item.licenseKey === selectedLicense?.key)
  const selectedHistory = history.filter((item) => item.licenseKey === selectedLicense?.key)

  const totalCustomers = new Set(licenses.map((item) => item.customerEmail)).size
  const activeDevices = activations.filter((item) => item.status === 'active').length
  const blockedDevices = activations.filter((item) => item.status === 'blocked').length
  const expiredLicenses = licenses.filter((item) => new Date(`${item.expiresAt}T23:59:59`).getTime() < Date.now()).length

  async function renewSelected() {
    if (!selectedLicense || !renewDate) return
    await renew(selectedLicense.id, renewDate)
    setMessage(`Licença ${selectedLicense.key} renovada até ${new Date(`${renewDate}T12:00:00`).toLocaleDateString('pt-BR')}.`)
    setRenewDate('')
  }

  async function updateLimit() {
    if (!selectedLicense) return
    await updateDeviceLimit(selectedLicense.id, deviceLimit)
    setMessage(`Limite de dispositivos atualizado para ${deviceLimit}.`)
  }

  function exportControl() {
    const payload = {
      exportedAt: new Date().toISOString(),
      issuer: 'DEVVANDERSONAPPS',
      licenses,
      activations,
      history
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'AgendaMarketingV-controle-licenciamento.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file?: File) {
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      importData({
        activations: Array.isArray(payload.activations) ? payload.activations : [],
        history: Array.isArray(payload.history) ? payload.history : []
      })
      setMessage('Controle de ativações importado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">DEVVANDERSONAPPS — LICENSING CONTROL</span>
        <h1>Controle de licenças e dispositivos</h1>
        <p>Ativações, renovação, bloqueios, limites e histórico por cliente.</p>
      </div>
      <div className="actions">
        <input ref={importRef} hidden type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0])}/>
        <Button variant="secondary" onClick={() => importRef.current?.click()}><Upload size={17}/> Importar</Button>
        <Button variant="secondary" onClick={exportControl}><Download size={17}/> Exportar</Button>
      </div>
    </header>

    {message && <div className="form-message success">{message}</div>}

    <section className="license-control-summary">
      <article className="panel-card"><UsersRound/><span>Clientes licenciados</span><strong>{totalCustomers}</strong></article>
      <article className="panel-card"><Laptop/><span>Dispositivos ativos</span><strong>{activeDevices}</strong></article>
      <article className="panel-card"><ShieldAlert/><span>Dispositivos bloqueados</span><strong>{blockedDevices}</strong></article>
      <article className="panel-card"><Ban/><span>Licenças expiradas</span><strong>{expiredLicenses}</strong></article>
    </section>

    <div className="search-box"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, empresa ou chave..."/></div>

    <section className="licensing-control-layout">
      <article className="panel-card license-customer-list">
        <div className="panel-header"><div><h2>Clientes e licenças</h2><p>{filteredLicenses.length} registro(s).</p></div></div>
        <div className="license-customer-items">
          {filteredLicenses.map((license) => {
            const count = activations.filter((item) => item.licenseKey === license.key && item.status === 'active').length
            return <button type="button" key={license.id} className={selectedLicense?.id === license.id ? 'selected' : ''} onClick={() => {
              setSelectedKey(license.key)
              setDeviceLimit(license.maxDevices)
            }}>
              <div><span>{license.plan} • {license.status}</span><strong>{license.customerName}</strong><small>{license.companyName || license.customerEmail}</small></div>
              <div><strong>{count}/{license.maxDevices}</strong><small>dispositivos</small></div>
            </button>
          })}
          {!filteredLicenses.length && <div className="empty-inline">Nenhuma licença encontrada.</div>}
        </div>
      </article>

      <div className="license-control-detail">
        {selectedLicense ? <>
          <article className="panel-card selected-license-card">
            <div className="selected-license-head">
              <div><span>{selectedLicense.plan} • {selectedLicense.status}</span><h2>{selectedLicense.customerName}</h2><p>{selectedLicense.key}</p></div>
              <div><span>Validade</span><strong>{new Date(`${selectedLicense.expiresAt}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>
            </div>

            <div className="license-control-actions">
              <label>Nova validade<input type="date" value={renewDate} onChange={(event) => setRenewDate(event.target.value)}/></label>
              <Button onClick={renewSelected} disabled={!renewDate}><RefreshCw size={16}/> Renovar</Button>
              <label>Limite de dispositivos<input type="number" min={1} max={1000} value={deviceLimit} onChange={(event) => setDeviceLimit(Number(event.target.value))}/></label>
              <Button variant="secondary" onClick={updateLimit}>Atualizar limite</Button>
              {selectedLicense.status === 'revoked'
                ? <Button onClick={() => restore(selectedLicense.id)}><CheckCircle2 size={16}/> Restaurar licença</Button>
                : <Button variant="danger" onClick={() => revoke(selectedLicense.id)}><Ban size={16}/> Revogar licença</Button>}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-header"><div><h2>Dispositivos</h2><p>{selectedActivations.length} ativação(ões) registrada(s).</p></div><Laptop/></div>
            <div className="device-activation-list">
              {selectedActivations.map((activation) => <div key={activation.id} className={`status-${activation.status}`}>
                <div className="device-activation-icon">{/mobile|android|iphone/i.test(activation.deviceName) ? <Smartphone/> : <Laptop/>}</div>
                <div><span>{activation.status}</span><strong>{activation.deviceName}</strong><small>ID: {activation.deviceId}</small><small>Último acesso: {new Date(activation.lastSeenAt).toLocaleString('pt-BR')}</small></div>
                <div className="device-activation-actions">
                  {activation.status === 'active' && <Button variant="danger" onClick={() => blockDevice(activation.id)}>Bloquear</Button>}
                  {activation.status === 'blocked' && <Button onClick={() => restoreDevice(activation.id)}>Liberar</Button>}
                  {activation.status !== 'released' && <Button variant="secondary" onClick={() => releaseDevice(activation.id)}>Remover ativação</Button>}
                </div>
              </div>)}
              {!selectedActivations.length && <div className="empty-inline">Nenhum dispositivo ativado.</div>}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-header"><div><h2>Histórico da licença</h2><p>Eventos de ativação e administração.</p></div><History/></div>
            <div className="license-history-list">
              {selectedHistory.map((event) => <div key={event.id}>
                <div><span>{event.type}</span><strong>{event.description}</strong><small>{new Date(event.createdAt).toLocaleString('pt-BR')}</small></div>
                <button type="button" onClick={() => removeHistory(event.id)}><Trash2 size={15}/></button>
              </div>)}
              {!selectedHistory.length && <div className="empty-inline">Nenhum evento registrado.</div>}
            </div>
          </article>
        </> : <article className="panel-card empty-panel"><strong>Selecione uma licença.</strong></article>}
      </div>
    </section>
  </div>
}
