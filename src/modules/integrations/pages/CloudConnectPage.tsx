import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2, Cloud, CloudUpload, DownloadCloud, FolderOpen,
  HardDrive, RefreshCw, ShieldCheck, Unplug
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCloudProvidersStore, type CloudProviderId } from '../../../lib/cloudProvidersStore'

const providerNames: Record<CloudProviderId, string> = {
  'proton-drive': 'Proton Drive',
  'google-drive': 'Google Drive'
}

export function CloudConnectPage() {
  const {
    providers, files, running, updateProvider, chooseProtonFolder,
    connectGoogle, disconnectGoogle, refreshStatus, syncNow, listFiles,
    restoreLocalFile
  } = useCloudProvidersStore()

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    refreshStatus().catch(() => undefined)
  }, [refreshStatus])

  const sortedFiles = useMemo(
    () => [...files].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)),
    [files]
  )

  async function run(action: () => Promise<void>, success: string) {
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  async function restore(path: string) {
    setError('')
    setMessage('')
    try {
      const result = await restoreLocalFile(path)
      setMessage(`${result.records} registro(s) restaurado(s). Reinicie o aplicativo.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">CLOUD CONNECT</span>
        <h1>Proton Drive e Google Drive</h1>
        <p>Backups criptografáveis, históricos e sincronização por provedor.</p>
      </div>
      <Button variant="secondary" onClick={() => Promise.all([
        listFiles('proton-drive'),
        listFiles('google-drive')
      ])}><RefreshCw size={17}/> Atualizar arquivos</Button>
    </header>

    {message && <div className="form-message success">{message}</div>}
    {error && <div className="form-message">{error}</div>}

    <section className="cloud-provider-grid">
      <article className={`panel-card cloud-provider-card ${providers['proton-drive'].connected ? 'connected' : ''}`}>
        <div className="cloud-provider-head">
          <div className="cloud-provider-icon proton"><ShieldCheck/></div>
          <div>
            <span>PASTA SINCRONIZADA</span>
            <h2>Proton Drive</h2>
            <p>Usa a pasta local mantida pelo aplicativo oficial do Proton Drive para Windows.</p>
          </div>
          {providers['proton-drive'].connected && <CheckCircle2 className="provider-check"/>}
        </div>

        <label className="full">Pasta do Proton Drive
          <div className="path-picker">
            <input value={providers['proton-drive'].folderPath} readOnly placeholder="Selecione a pasta sincronizada..."/>
            <Button variant="secondary" onClick={() => run(chooseProtonFolder, 'Pasta do Proton Drive configurada.')}><FolderOpen size={16}/> Selecionar</Button>
          </div>
        </label>

        <div className="cloud-options">
          <label><input type="checkbox" checked={providers['proton-drive'].automaticBackup} onChange={(event) => updateProvider('proton-drive', { automaticBackup: event.target.checked })}/> Backup automático</label>
          <label>Intervalo
            <select value={providers['proton-drive'].intervalMinutes} onChange={(event) => updateProvider('proton-drive', { intervalMinutes: Number(event.target.value) })}>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={360}>6 horas</option>
              <option value={1440}>Diário</option>
            </select>
          </label>
        </div>

        <div className="cloud-provider-actions">
          <Button onClick={() => run(() => syncNow('proton-drive'), 'Backup enviado para a pasta do Proton Drive.')} disabled={running || !providers['proton-drive'].connected}><CloudUpload size={17}/> Sincronizar agora</Button>
          <Button variant="secondary" onClick={() => listFiles('proton-drive')} disabled={!providers['proton-drive'].connected}><RefreshCw size={16}/> Listar</Button>
        </div>

        <small>O Proton Drive criptografa e sincroniza os arquivos pelo cliente oficial instalado no computador.</small>
        {providers['proton-drive'].lastSyncAt && <div className="last-sync">Última sincronização: {new Date(providers['proton-drive'].lastSyncAt).toLocaleString('pt-BR')}</div>}
      </article>

      <article className={`panel-card cloud-provider-card ${providers['google-drive'].connected ? 'connected' : ''}`}>
        <div className="cloud-provider-head">
          <div className="cloud-provider-icon google"><Cloud/></div>
          <div>
            <span>OAUTH 2.0 + DRIVE API</span>
            <h2>Google Drive</h2>
            <p>Conexão pelo navegador usando autorização OAuth 2.0 com PKCE.</p>
          </div>
          {providers['google-drive'].connected && <CheckCircle2 className="provider-check"/>}
        </div>

        <label className="full">Google OAuth Client ID
          <input
            value={providers['google-drive'].googleClientId}
            onChange={(event) => updateProvider('google-drive', { googleClientId: event.target.value })}
            placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"
          />
        </label>

        <div className="cloud-options">
          <label><input type="checkbox" checked={providers['google-drive'].automaticBackup} onChange={(event) => updateProvider('google-drive', { automaticBackup: event.target.checked })}/> Backup automático</label>
          <label>Intervalo
            <select value={providers['google-drive'].intervalMinutes} onChange={(event) => updateProvider('google-drive', { intervalMinutes: Number(event.target.value) })}>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={360}>6 horas</option>
              <option value={1440}>Diário</option>
            </select>
          </label>
        </div>

        <div className="cloud-provider-actions">
          {!providers['google-drive'].connected
            ? <Button onClick={() => run(connectGoogle, 'Google Drive conectado.')} disabled={running}><Cloud size={17}/> Conectar Google</Button>
            : <>
              <Button onClick={() => run(() => syncNow('google-drive'), 'Backup enviado ao Google Drive.')} disabled={running}><CloudUpload size={17}/> Sincronizar agora</Button>
              <Button variant="danger" onClick={() => run(disconnectGoogle, 'Google Drive desconectado.')}><Unplug size={16}/> Desconectar</Button>
            </>
          }
        </div>

        <small>O aplicativo solicita somente o escopo `drive.file`, limitado aos arquivos criados pelo AgendaMarketingV.</small>
        {providers['google-drive'].lastSyncAt && <div className="last-sync">Última sincronização: {new Date(providers['google-drive'].lastSyncAt).toLocaleString('pt-BR')}</div>}
      </article>
    </section>

    <article className="panel-card cloud-file-center">
      <div className="panel-header">
        <div><h2>Arquivos sincronizados</h2><p>{sortedFiles.length} backup(s) encontrado(s).</p></div>
        <HardDrive/>
      </div>

      <div className="cloud-file-list">
        {sortedFiles.map((file) => <div key={`${file.provider}-${file.id}`}>
          <div className={`cloud-file-provider ${file.provider}`}>
            {file.provider === 'proton-drive' ? <ShieldCheck/> : <Cloud/>}
          </div>
          <div>
            <span>{providerNames[file.provider]}</span>
            <strong>{file.name}</strong>
            <small>{file.modifiedAt ? new Date(file.modifiedAt).toLocaleString('pt-BR') : 'Sem data'} • {(file.size / 1024).toFixed(1)} KB</small>
          </div>
          {file.provider === 'proton-drive'
            ? <Button variant="secondary" onClick={() => restore(file.pathOrId)}><DownloadCloud size={16}/> Restaurar</Button>
            : <span className="cloud-only-label">Disponível na nuvem</span>
          }
        </div>)}
        {!sortedFiles.length && <div className="empty-inline">Nenhum backup listado.</div>}
      </div>
    </article>

    <article className="panel-card cloud-security-note">
      <ShieldCheck/>
      <div>
        <strong>Segurança da sincronização</strong>
        <p>O token do Google é armazenado com o recurso seguro do Electron quando disponível. A pasta Proton depende da autenticação e criptografia do aplicativo oficial do Proton Drive.</p>
      </div>
    </article>
  </div>
}
