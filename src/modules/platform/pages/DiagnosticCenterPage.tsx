import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Download, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '../../../components/Button'
import { runDiagnosticSuite, type DiagnosticSuiteResult } from '../../../lib/diagnosticSuite'

export function DiagnosticCenterPage(){
  const[result,setResult]=useState<DiagnosticSuiteResult>(()=>runDiagnosticSuite())
  const summary=useMemo(()=>({
    healthy:result.checks.filter((item)=>item.status==='healthy').length,
    warning:result.checks.filter((item)=>item.status==='warning').length,
    critical:result.checks.filter((item)=>item.status==='critical').length
  }),[result])

  function exportReport(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}))
    const anchor=document.createElement('a')
    anchor.href=url
    anchor.download='AgendaMarketingV-RC2-diagnostico.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">QUALITY & PRODUCTION</span><h1>Central de Diagnósticos</h1><p>Varredura consolidada de dados, backup, plugins, erros e desempenho.</p></div>
      <div className="actions"><Button variant="secondary" onClick={exportReport}><Download size={17}/> Exportar</Button><Button onClick={()=>setResult(runDiagnosticSuite())}><RefreshCw size={17}/> Executar diagnóstico</Button></div>
    </header>

    <section className="diagnostic-hero panel-card">
      <div className={`diagnostic-score ${result.score<65?'critical':result.score<85?'warning':''}`}><strong>{result.score}</strong><span>/100</span></div>
      <div><Activity/><h2>{result.score>=85?'Sistema saudável':result.score>=65?'Sistema requer atenção':'Risco para produção'}</h2><p>Gerado em {new Date(result.generatedAt).toLocaleString('pt-BR')}</p></div>
    </section>

    <section className="rc-summary-grid">
      <article className="panel-card"><CheckCircle2/><span>Saudáveis</span><strong>{summary.healthy}</strong></article>
      <article className="panel-card"><AlertTriangle/><span>Atenção</span><strong>{summary.warning}</strong></article>
      <article className="panel-card"><XCircle/><span>Críticos</span><strong>{summary.critical}</strong></article>
      <article className="panel-card"><Activity/><span>Total</span><strong>{result.checks.length}</strong></article>
    </section>

    <section className="diagnostic-grid">
      {result.checks.map((check)=><article key={check.id} className={`panel-card diagnostic-card status-${check.status}`}>
        <div className="diagnostic-card-head">{check.status==='healthy'?<CheckCircle2/>:check.status==='warning'?<AlertTriangle/>:<XCircle/>}<span>{check.status}</span></div>
        <h2>{check.name}</h2><p>{check.message}</p><small>{check.recommendation}</small>
      </article>)}
    </section>
  </div>
}
