import { Cloud, HardDrive, ShieldCheck, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { useCloudProvidersStore } from '../../../lib/cloudProvidersStore'

export function CloudSyncPage() {
  const navigate = useNavigate()
  const providers = useCloudProvidersStore((state) => state.providers)
  const google = providers['google-drive']
  const proton = providers['proton-drive']

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">SINCRONIZAÇÃO REAL</span>
        <h1>Central de sincronização</h1>
        <p>Acesse somente integrações que efetivamente salvam, carregam ou comparam dados.</p>
      </div>
    </header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Google Drive</span><strong>{google.connected ? 'Conectado' : 'Desconectado'}</strong></article>
      <article className="panel-card compact-card"><span>Proton Drive</span><strong>{proton.connected ? 'Configurado' : 'Não configurado'}</strong></article>
      <article className="panel-card compact-card"><span>Último backup Google</span><strong>{google.lastSyncAt ? new Date(google.lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}</strong></article>
      <article className="panel-card compact-card"><span>Último backup Proton</span><strong>{proton.lastSyncAt ? new Date(proton.lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}</strong></article>
    </section>

    <section className="integration-grid">
      <article className="panel-card integration-card">
        <Cloud/>
        <h2>Backups em nuvem</h2>
        <p>Envie backups reais para Google Drive ou para a pasta sincronizada do Proton Drive.</p>
        <Button onClick={() => navigate('/cloud-connect')}><HardDrive size={17}/> Abrir Cloud Connect</Button>
      </article>

      <article className="panel-card integration-card">
        <UsersRound/>
        <h2>Contatos conectados</h2>
        <p>Compare Google Contacts, importe vCard do celular e resolva conflitos antes de alterar dados.</p>
        <Button onClick={() => navigate('/contacts-sync')}><UsersRound size={17}/> Sincronizar contatos</Button>
      </article>
    </section>

    <article className="panel-card cloud-security-note">
      <ShieldCheck/>
      <div>
        <strong>Sem sincronização simulada</strong>
        <p>Esta tela não mantém uma fila fictícia nem marca operações como concluídas sem transmissão. Use os fluxos acima para executar ações verificáveis.</p>
      </div>
    </article>
  </div>
}
