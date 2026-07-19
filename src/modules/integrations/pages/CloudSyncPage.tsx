import { Cloud, CloudDownload, CloudUpload, Play, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCloudSyncStore, type SyncJob } from '../../../lib/cloudSyncStore'

const statusLabels = {
  idle: 'Aguardando',
  syncing: 'Sincronizando',
  success: 'Concluída',
  error: 'Erro'
} as const

const jobStatusLabels: Record<SyncJob['status'], string> = {
  queued: 'Na fila',
  running: 'Processando',
  success: 'Concluído',
  failed: 'Falhou'
}

export function CloudSyncPage(){
  const{enabled,endpoint,lastSyncAt,status,queue,setEnabled,setEndpoint,enqueue,process,clearFinished}=useCloudSyncStore()
  const pendingJobs = queue.some((item)=>['queued','failed'].includes(item.status))
  const processing = status === 'syncing'

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">DEVVANDERSON CLOUD</span><h1>Sincronização em Nuvem</h1><p>Prepare envio, recebimento e sincronização entre dispositivos.</p></div><Button onClick={process} disabled={!enabled||!pendingJobs||processing}><Play size={17}/> {processing?'Processando...':'Processar fila'}</Button></header>
    <section className="sync-hero panel-card" aria-live="polite"><div className="sync-cloud-icon"><Cloud/></div><div><span>Situação</span><h2>{statusLabels[status]}</h2><p>{lastSyncAt?`Última sincronização: ${new Date(lastSyncAt).toLocaleString('pt-BR')}`:'Ainda não sincronizado.'}</p></div><label className="sync-switch"><input type="checkbox" checked={enabled} onChange={(event)=>setEnabled(event.target.checked)}/><span>{enabled?'Ativado':'Desativado'}</span></label></section>
    <section className="settings-grid">
      <article className="panel-card"><h2>Configuração</h2><label className="full">Endereço do serviço em nuvem<input type="url" value={endpoint} onChange={(event)=>setEndpoint(event.target.value)} placeholder="https://api.seudominio.com/sync"/></label><div className="sync-actions"><Button variant="secondary" onClick={()=>enqueue('upload')} disabled={processing}><CloudUpload size={17}/> Enviar base</Button><Button variant="secondary" onClick={()=>enqueue('download')} disabled={processing}><CloudDownload size={17}/> Baixar base</Button></div><p className="meta">A fila funciona localmente. A transmissão entre dispositivos exige um serviço autenticado.</p></article>
      <article className="panel-card"><div className="panel-header"><div><h2>Fila</h2><p>{queue.length} {queue.length === 1 ? 'item' : 'itens'}</p></div><Button variant="secondary" onClick={clearFinished} disabled={!queue.some(item=>['success','failed'].includes(item.status))||processing}><Trash2 size={16}/> Limpar concluídos</Button></div><div className="sync-job-list">{queue.map((item)=><div key={item.id}><div className={`sync-direction ${item.direction}`}>{item.direction==='upload'?<CloudUpload/>:<CloudDownload/>}</div><div><strong>{item.direction==='upload'?'Enviar base':'Baixar base'}</strong><span>{item.records} {item.records === 1 ? 'registro' : 'registros'} • {jobStatusLabels[item.status]}</span></div><small>{new Date(item.updatedAt).toLocaleString('pt-BR')}</small></div>)}{!queue.length&&<div className="empty-inline">Fila vazia.</div>}</div></article>
    </section>
  </div>
}
