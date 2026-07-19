import { useMemo, useState } from 'react'
import {
  Activity, Ban, CheckCircle2, CloudCog, DownloadCloud, Laptop,
  RefreshCw, Server, ShieldCheck, UploadCloud, UsersRound
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { useLicenseAuthorityStore } from '../../../lib/licenseAuthorityStore'
import { useLicenseServerStore } from '../../../lib/licenseServerStore'

export function DevvandersonPortalPage(){
  const localLicenses=useLicenseAuthorityStore((state)=>state.licenses)
  const {
    endpoint,adminToken,connected,loading,overview,licenses,activations,events,
    lastSyncAt,error,configure,testConnection,syncOverview,publishLicense,
    updateLicense,updateActivation
  }=useLicenseServerStore()
  const[url,setUrl]=useState(endpoint)
  const[token,setToken]=useState(adminToken)
  const[message,setMessage]=useState('')

  const unpublished=useMemo(()=>localLicenses.filter((item)=>!licenses.some((remote)=>remote.key===item.key)),[localLicenses,licenses])

  async function connect(){
    configure(url,token)
    const ok=await testConnection()
    if(ok){
      setMessage('Servidor conectado.')
      await syncOverview().catch(()=>undefined)
    }
  }

  async function publishAll(){
    let count=0
    for(const license of unpublished){
      await publishLicense({
        id:license.id,
        key:license.key,
        plan:license.plan,
        status:license.status,
        customerName:license.customerName,
        customerEmail:license.customerEmail,
        companyName:license.companyName,
        cnpj:license.cnpj,
        maxDevices:license.maxDevices,
        issuedAt:license.issuedAt,
        expiresAt:new Date(`${license.expiresAt}T23:59:59`).toISOString(),
        notes:license.notes
      })
      count+=1
    }
    setMessage(`${count} licença(s) publicada(s).`)
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">PORTAL DEVVANDERSONAPPS</span><h1>Cloud Enterprise</h1><p>Administração central de clientes, licenças e dispositivos.</p></div>
      <Button onClick={()=>syncOverview()} disabled={loading||!connected}><RefreshCw size={17}/> Sincronizar painel</Button>
    </header>

    {message&&<div className="form-message success">{message}</div>}
    {error&&<div className="form-message">{error}</div>}

    <section className="portal-server-config panel-card">
      <div className={`server-status-icon ${connected?'connected':''}`}><Server/></div>
      <div className="portal-server-fields">
        <label>Endereço do License Server<input value={url} onChange={(event)=>setUrl(event.target.value)} placeholder="https://licencas.seudominio.com"/></label>
        <label>Token administrativo<input type="password" value={token} onChange={(event)=>setToken(event.target.value)} placeholder="Token secreto do servidor"/></label>
      </div>
      <Button onClick={connect} disabled={loading}><CloudCog size={17}/> {connected?'Reconectar':'Conectar'}</Button>
    </section>

    <section className="portal-summary-grid">
      <article className="panel-card"><UsersRound/><span>Licenças</span><strong>{overview.licenses}</strong></article>
      <article className="panel-card"><CheckCircle2/><span>Licenças liberadas</span><strong>{overview.activeLicenses}</strong></article>
      <article className="panel-card"><Ban/><span>Revogadas</span><strong>{overview.revokedLicenses}</strong></article>
      <article className="panel-card"><Laptop/><span>Dispositivos ativos</span><strong>{overview.activeDevices}</strong></article>
    </section>

    <section className="portal-publish panel-card">
      <div><UploadCloud/><div><h2>Publicar licenças locais</h2><p>{unpublished.length} licença(s) ainda não existem no servidor central.</p></div></div>
      <Button onClick={publishAll} disabled={!connected||!unpublished.length||loading}>Publicar todas</Button>
    </section>

    <section className="portal-main-grid">
      <article className="panel-card">
        <div className="panel-header"><div><h2>Licenças online</h2><p>{licenses.length} registro(s).</p></div><ShieldCheck/></div>
        <div className="portal-license-list">
          {licenses.map((license)=><div key={license.id} className={`status-${license.status}`}>
            <div><span>{license.plan} • {license.status}</span><strong>{license.customerName||license.companyName}</strong><small>{license.key}</small><small>Validade: {new Date(license.expiresAt).toLocaleDateString('pt-BR')}</small></div>
            <div>
              {license.status==='revoked'
                ? <Button onClick={()=>updateLicense(license.id,{status:'active'})}>Restaurar</Button>
                : <Button variant="danger" onClick={()=>updateLicense(license.id,{status:'revoked'})}>Revogar</Button>}
            </div>
          </div>)}
          {!licenses.length&&<div className="empty-inline">Nenhuma licença carregada.</div>}
        </div>
      </article>

      <article className="panel-card">
        <div className="panel-header"><div><h2>Dispositivos online</h2><p>{activations.length} ativação(ões).</p></div><Laptop/></div>
        <div className="portal-device-list">
          {activations.map((activation)=><div key={activation.id} className={`status-${activation.status}`}>
            <div><span>{activation.status}</span><strong>{activation.deviceName}</strong><small>{activation.licenseKey}</small><small>Último acesso: {new Date(activation.lastSeenAt).toLocaleString('pt-BR')}</small></div>
            <div>
              {activation.status==='active'
                ? <Button variant="danger" onClick={()=>updateActivation(activation.id,{status:'blocked'})}>Bloquear</Button>
                : <Button onClick={()=>updateActivation(activation.id,{status:'active'})}>Liberar</Button>}
            </div>
          </div>)}
          {!activations.length&&<div className="empty-inline">Nenhum dispositivo carregado.</div>}
        </div>
      </article>
    </section>

    <article className="panel-card portal-events">
      <div className="panel-header"><div><h2>Atividade do servidor</h2><p>{lastSyncAt?`Última sincronização: ${new Date(lastSyncAt).toLocaleString('pt-BR')}`:'Ainda não sincronizado.'}</p></div><Activity/></div>
      <div className="portal-event-list">
        {events.slice(0,100).map((event)=><div key={event.id}><DownloadCloud/><div><span>{event.type} • {event.licenseKey}</span><strong>{event.description}</strong><small>{new Date(event.createdAt).toLocaleString('pt-BR')}</small></div></div>)}
        {!events.length&&<div className="empty-inline">Nenhum evento carregado.</div>}
      </div>
    </article>
  </div>
}
