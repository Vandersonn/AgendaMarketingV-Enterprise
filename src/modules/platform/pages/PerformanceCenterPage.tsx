import { useMemo } from 'react'
import { Activity, Clock3, Database, Gauge, MemoryStick, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { usePerformanceMonitorStore } from '../../../lib/performanceMonitorStore'

export function PerformanceCenterPage(){
  const{snapshots,capture,clear}=usePerformanceMonitorStore()
  const latest=snapshots[0]
  const average=useMemo(()=>snapshots.length?Math.round(snapshots.reduce((sum,item)=>sum+item.score,0)/snapshots.length):0,[snapshots])
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">PERFORMANCE</span><h1>Central de Desempenho</h1><p>Monitore inicialização, memória, armazenamento, DOM e recursos carregados.</p></div><div className="actions"><Button variant="secondary" onClick={clear}><Trash2 size={17}/> Limpar histórico</Button><Button onClick={capture}><RefreshCw size={17}/> Medir agora</Button></div></header>
    <section className="performance-hero panel-card"><div className={`performance-score ${(latest?.score??0)<65?'critical':(latest?.score??0)<85?'warning':''}`}><Gauge/><strong>{latest?.score??'—'}</strong></div><div><h2>{latest?'Última medição concluída':'Nenhuma medição realizada'}</h2><p>{latest?new Date(latest.createdAt).toLocaleString('pt-BR'):'Execute a primeira captura.'}</p></div><div className="performance-average"><span>Média histórica</span><strong>{average||'—'}</strong></div></section>
    <section className="performance-metrics">
      <article className="panel-card"><Clock3/><span>Carregamento</span><strong>{latest?`${latest.navigationMs.toFixed(0)} ms`:'—'}</strong></article>
      <article className="panel-card"><MemoryStick/><span>Memória JS</span><strong>{latest?.memoryMb?`${latest.memoryMb.toFixed(1)} MB`:'Indisponível'}</strong></article>
      <article className="panel-card"><Database/><span>Armazenamento</span><strong>{latest?`${latest.storageMb.toFixed(2)} MB`:'—'}</strong></article>
      <article className="panel-card"><Activity/><span>Nós DOM</span><strong>{latest?.domNodes??'—'}</strong></article>
    </section>
    <article className="panel-card performance-history"><div className="panel-header"><div><h2>Histórico</h2><p>Últimas 100 medições.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Data</th><th>Score</th><th>Carregamento</th><th>Memória</th><th>Storage</th><th>DOM</th><th>Recursos</th></tr></thead><tbody>{snapshots.map((item)=><tr key={item.id}><td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td><td><strong>{item.score}</strong></td><td>{item.navigationMs.toFixed(0)} ms</td><td>{item.memoryMb?`${item.memoryMb.toFixed(1)} MB`:'—'}</td><td>{item.storageMb.toFixed(2)} MB</td><td>{item.domNodes}</td><td>{item.resourceCount}</td></tr>)}{!snapshots.length&&<tr><td colSpan={7} className="empty-inline">Nenhuma medição.</td></tr>}</tbody></table></div></article>
  </div>
}
