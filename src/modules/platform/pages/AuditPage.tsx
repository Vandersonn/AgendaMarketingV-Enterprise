import { Download, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAuditStore } from '../../../lib/auditStore'

export function AuditPage() {
  const { entries, clear } = useAuditStore()
  function exportCsv(){
    const rows = [['Data','Usuário','Módulo','Ação','Descrição'],...entries.map(e=>[new Date(e.createdAt).toLocaleString('pt-BR'),e.user,e.module,e.action,e.description])]
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='auditoria.csv';a.click();URL.revokeObjectURL(url)
  }
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">SEGURANÇA E GOVERNANÇA</span><h1>Auditoria</h1><p>Registro das ações administrativas do sistema.</p></div><div className="actions"><Button variant="secondary" onClick={exportCsv} disabled={!entries.length}><Download size={17}/> Exportar</Button><Button variant="danger" onClick={clear} disabled={!entries.length}><Trash2 size={17}/> Limpar</Button></div></header>
    <article className="panel-card audit-panel">
      <div className="audit-header"><ShieldCheck/><strong>{entries.length} evento(s) registrado(s)</strong></div>
      <div className="timeline audit-timeline">{entries.map(e=><div key={e.id}><span>{new Date(e.createdAt).toLocaleString('pt-BR')} • {e.user}</span><strong>{e.module} — {e.action}</strong><p>{e.description}</p></div>)}{!entries.length&&<div className="empty-inline">Nenhum evento de auditoria registrado.</div>}</div>
    </article>
  </div>
}
