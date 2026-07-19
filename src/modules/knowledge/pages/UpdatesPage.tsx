import { CheckCircle2, Download, RefreshCw, Rocket, ShieldCheck } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useUpdateCenterStore } from '../../../lib/updateCenterStore'

export function UpdatesPage() {
  const { currentVersion, available, status, progress, lastCheckAt, check, simulateDownload, apply } = useUpdateCenterStore()

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">UPDATE SERVICE</span><h1>Central de atualizações</h1><p>Verifique, baixe e prepare novas versões do AgendaMarketingV.</p></div><Button onClick={check} disabled={status==='checking'}><RefreshCw size={17}/> {status==='checking'?'Verificando...':'Verificar agora'}</Button></header>

    <section className="update-hero panel-card">
      <div className="update-version-icon"><Rocket/></div>
      <div><span>Versão instalada</span><h2>{currentVersion}</h2><p>{lastCheckAt ? `Última verificação: ${new Date(lastCheckAt).toLocaleString('pt-BR')}` : 'Nenhuma verificação realizada.'}</p></div>
      <div className={`update-status-pill status-${status}`}>{status}</div>
    </section>

    {available && <article className="panel-card available-update-card">
      <div className="available-update-head"><div><span>NOVA VERSÃO</span><h2>{available.version} — {available.title}</h2><p>Publicada em {new Date(available.publishedAt).toLocaleDateString('pt-BR')}</p></div><ShieldCheck/></div>
      <ul>{available.notes.map((note) => <li key={note}><CheckCircle2 size={16}/>{note}</li>)}</ul>
      {status==='downloading' && <div className="update-progress"><div style={{width:`${progress}%`}}/><span>{progress}%</span></div>}
      <div className="actions">
        {status==='available' && <Button onClick={simulateDownload}><Download size={17}/> Baixar atualização</Button>}
        {status==='ready' && <Button onClick={apply}><Rocket size={17}/> Preparar instalação</Button>}
      </div>
    </article>}

    {!available && status !== 'checking' && <article className="panel-card update-empty"><CheckCircle2 size={38}/><h2>{status==='updated'?'Atualização preparada':'Sistema atualizado'}</h2><p>{status==='updated'?'Reinicie o aplicativo para concluir a instalação.':'Você está usando a versão mais recente disponível.'}</p></article>}

    <article className="panel-card update-security-note"><ShieldCheck/><div><strong>Atualização segura</strong><p>Em produção, os pacotes devem ser assinados digitalmente e validados por checksum antes da instalação.</p></div></article>
  </div>
}
