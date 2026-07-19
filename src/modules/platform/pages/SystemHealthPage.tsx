import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, CheckCircle2, Database, Download,
  HardDrive, RefreshCcw, Server, ShieldAlert, Trash2, Upload
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { useBackupStore } from '../../../lib/backupStore'
import { runSystemDiagnostics } from '../../../lib/systemDiagnostics'
import { useSystemLogStore } from '../../../lib/systemLogStore'

const statusLabels = {
  healthy: 'Saudável',
  warning: 'Atenção',
  critical: 'Crítico'
}

export function SystemHealthPage() {
  const logs = useSystemLogStore((state) => state.logs)
  const clearLogs = useSystemLogStore((state) => state.clearLogs)
  const { snapshots, settings, createSnapshot, deleteSnapshot, restoreSnapshot, updateSettings } = useBackupStore()
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')

  const diagnostics = useMemo(() => runSystemDiagnostics(), [revision, snapshots.length])
  const critical = diagnostics.filter((item) => item.status === 'critical').length
  const warnings = diagnostics.filter((item) => item.status === 'warning').length
  const score = Math.max(0, 100 - critical * 30 - warnings * 12)

  function restore(id: string) {
    const count = restoreSnapshot(id)
    setMessage(`${count} registro(s) restaurado(s). Reinicie o aplicativo para recarregar todos os módulos.`)
    setRevision((value) => value + 1)
  }

  function exportLogs() {
    const headers = ['Data', 'Nível', 'Origem', 'Mensagem', 'Detalhes']
    const rows = logs.map((item) => [
      new Date(item.createdAt).toLocaleString('pt-BR'),
      item.level,
      item.source,
      item.message,
      item.details
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'logs-tecnicos.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CONFIABILIDADE E OPERAÇÃO</span>
          <h1>Saúde do sistema</h1>
          <p>Diagnósticos, backups, integridade e logs técnicos.</p>
        </div>
        <Button onClick={() => setRevision((value) => value + 1)}>
          <RefreshCcw size={17} /> Executar diagnóstico
        </Button>
      </header>

      {message && <div className="form-message success">{message}</div>}

      <section className="system-health-hero panel-card">
        <div className={`health-score-circle ${score < 60 ? 'critical' : score < 85 ? 'warning' : ''}`}>
          <strong>{score}</strong>
          <span>/100</span>
        </div>
        <div>
          <span className="eyebrow">PONTUAÇÃO OPERACIONAL</span>
          <h2>{score >= 85 ? 'Sistema estável' : score >= 60 ? 'Atenção necessária' : 'Risco operacional'}</h2>
          <p>{critical} item(ns) crítico(s) e {warnings} aviso(s) encontrados.</p>
        </div>
      </section>

      <section className="diagnostics-grid">
        {diagnostics.map((check) => {
          const Icon = check.id === 'storage' ? HardDrive
            : check.id === 'cloud' ? Server
            : check.id === 'integrity' ? ShieldAlert
            : check.id === 'backup' ? Database
            : Activity

          return (
            <article key={check.id} className={`panel-card diagnostic-card status-${check.status}`}>
              <div className="diagnostic-head">
                <div className="diagnostic-icon"><Icon /></div>
                <span>{statusLabels[check.status]}</span>
              </div>
              <h2>{check.name}</h2>
              <p>{check.message}</p>
              <small>{check.recommendation}</small>
            </article>
          )
        })}
      </section>

      <section className="settings-grid health-sections">
        <article className="panel-card">
          <div className="panel-header">
            <div><h2>Backup automático</h2><p>Histórico local de segurança.</p></div>
            <Button onClick={() => createSnapshot(`Backup manual ${new Date().toLocaleString('pt-BR')}`)}>
              <Download size={17} /> Criar agora
            </Button>
          </div>

          <div className="backup-settings-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => updateSettings({ enabled: event.target.checked })}
              />
              Ativar backup automático
            </label>
            <label>Intervalo em horas
              <input
                type="number"
                min="1"
                value={settings.intervalHours}
                onChange={(event) => updateSettings({ intervalHours: Number(event.target.value) })}
              />
            </label>
            <label>Manter últimos
              <input
                type="number"
                min="1"
                max="30"
                value={settings.keepLast}
                onChange={(event) => updateSettings({ keepLast: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="backup-snapshot-list">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id}>
                <div>
                  <strong>{snapshot.label}</strong>
                  <span>{snapshot.type} • {new Date(snapshot.createdAt).toLocaleString('pt-BR')} • {(snapshot.estimatedBytes / 1024).toFixed(0)} KB</span>
                </div>
                <div>
                  <button type="button" title="Restaurar" onClick={() => restore(snapshot.id)}><Upload size={16} /></button>
                  <button type="button" className="icon-danger" title="Excluir" onClick={() => deleteSnapshot(snapshot.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {!snapshots.length && <div className="empty-inline">Nenhum snapshot local criado.</div>}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-header">
            <div><h2>Logs técnicos</h2><p>Erros e avisos da aplicação.</p></div>
            <div className="actions">
              <Button variant="secondary" onClick={exportLogs} disabled={!logs.length}><Download size={17} /> Exportar</Button>
              <Button variant="danger" onClick={clearLogs} disabled={!logs.length}><Trash2 size={17} /> Limpar</Button>
            </div>
          </div>

          <div className="system-log-list">
            {logs.slice(0, 50).map((log) => (
              <div key={log.id} className={`system-log level-${log.level}`}>
                <div>
                  {log.level === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div>
                  <strong>{log.source} — {log.message}</strong>
                  <p>{log.details || 'Sem detalhes adicionais.'}</p>
                  <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
            {!logs.length && <div className="empty-inline">Nenhum erro técnico registrado.</div>}
          </div>
        </article>
      </section>
    </div>
  )
}
