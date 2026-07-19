import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Circle, Download, Play, RefreshCcw,
  Rocket, ShieldCheck, TestTube2, Trash2, XCircle
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { runDataMigrations, getCurrentSchemaVersion } from '../../../lib/dataMigration'
import { useReleaseCandidateStore, type ReleaseNote, type TestCategory } from '../../../lib/releaseCandidateStore'

const categoryLabels: Record<TestCategory,string> = {
  core:'Núcleo',
  data:'Dados',
  security:'Segurança',
  business:'Negócio',
  integration:'Integrações',
  ux:'Experiência'
}

const noteLabels: Record<ReleaseNote['type'],string> = {
  feature:'Novidade',
  fix:'Correção',
  security:'Segurança',
  known_issue:'Limitação conhecida'
}

export function ReleaseCandidatePage() {
  const {
    releaseName, buildNumber, tests, notes, lastRunAt, approvedForPilot,
    runAll, runOne, resetTests, setApprovedForPilot, addNote, removeNote
  } = useReleaseCandidateStore()

  const [running,setRunning] = useState(false)
  const [migrationMessage,setMigrationMessage] = useState('')
  const [noteText,setNoteText] = useState('')
  const [noteType,setNoteType] = useState<ReleaseNote['type']>('feature')

  const summary = useMemo(()=>({
    passed:tests.filter((item)=>item.status==='passed').length,
    failed:tests.filter((item)=>item.status==='failed').length,
    blocked:tests.filter((item)=>item.status==='blocked').length,
    pending:tests.filter((item)=>item.status==='pending').length,
    criticalFailed:tests.filter((item)=>item.critical&&['failed','blocked'].includes(item.status)).length
  }),[tests])

  const score = Math.round((summary.passed / tests.length) * 100)
  const canApprove = summary.criticalFailed === 0 && summary.pending === 0 && summary.failed === 0

  async function executeAll() {
    setRunning(true)
    try {
      await runAll()
    } finally {
      setRunning(false)
    }
  }

  function migrate() {
    const result=runDataMigrations()
    setMigrationMessage(result.success
      ? `Migração concluída: schema ${result.fromVersion} → ${result.toVersion}. ${result.applied.join(' ')}`
      : 'A migração falhou. Consulte os logs técnicos.'
    )
  }

  function exportReport() {
    const report = {
      release:releaseName,
      build:buildNumber,
      generatedAt:new Date().toISOString(),
      schemaVersion:getCurrentSchemaVersion(),
      approvedForPilot,
      score,
      summary,
      tests,
      notes
    }
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}))
    const anchor=document.createElement('a')
    anchor.href=url
    anchor.download='AgendaMarketingV-RC1-relatorio-homologacao.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function submitNote(event:React.FormEvent) {
    event.preventDefault()
    if(!noteText.trim()) return
    addNote(noteType,noteText.trim())
    setNoteText('')
  }

  return <div className="page">
    <header className="page-header">
      <div>
        <span className="eyebrow">RELEASE CANDIDATE</span>
        <h1>Centro de homologação</h1>
        <p>{releaseName} • Build {buildNumber}</p>
      </div>
      <div className="actions">
        <Button variant="secondary" onClick={exportReport}><Download size={17}/> Exportar relatório</Button>
        <Button onClick={executeAll} disabled={running}><Play size={17}/> {running?'Executando...':'Executar bateria'}</Button>
      </div>
    </header>

    {migrationMessage&&<div className="form-message success">{migrationMessage}</div>}

    <section className="rc-hero panel-card">
      <div className={`rc-score ${score<70?'critical':score<90?'warning':''}`}>
        <strong>{score}</strong><span>/100</span>
      </div>
      <div>
        <span className="eyebrow">QUALIDADE DA VERSÃO</span>
        <h2>{canApprove?'Apta para piloto controlado':'Ainda não aprovada'}</h2>
        <p>{summary.passed} aprovados • {summary.failed} falhas • {summary.blocked} bloqueados • {summary.pending} pendentes</p>
      </div>
      <label className={`pilot-approval ${approvedForPilot?'approved':''}`}>
        <input type="checkbox" checked={approvedForPilot} disabled={!canApprove} onChange={(event)=>setApprovedForPilot(event.target.checked)}/>
        <span>{approvedForPilot?'Piloto aprovado':'Aprovar piloto'}</span>
      </label>
    </section>

    <section className="rc-summary-grid">
      <article className="panel-card"><CheckCircle2/><span>Aprovados</span><strong>{summary.passed}</strong></article>
      <article className="panel-card"><XCircle/><span>Falhas</span><strong>{summary.failed}</strong></article>
      <article className="panel-card"><AlertTriangle/><span>Bloqueados</span><strong>{summary.blocked}</strong></article>
      <article className="panel-card"><Circle/><span>Pendentes</span><strong>{summary.pending}</strong></article>
    </section>

    <section className="rc-main-grid">
      <article className="panel-card">
        <div className="panel-header">
          <div><h2>Testes de aceite</h2><p>{lastRunAt?`Última execução: ${new Date(lastRunAt).toLocaleString('pt-BR')}`:'Ainda não executados.'}</p></div>
          <Button variant="secondary" onClick={resetTests}><RefreshCcw size={16}/> Reiniciar</Button>
        </div>

        <div className="acceptance-test-list">
          {tests.map((test)=><div key={test.id} className={`acceptance-test status-${test.status}`}>
            <div className="acceptance-status">
              {test.status==='passed'?<CheckCircle2/>:test.status==='failed'?<XCircle/>:test.status==='blocked'?<AlertTriangle/>:<TestTube2/>}
            </div>
            <div>
              <span>{categoryLabels[test.category]} {test.critical?'• Crítico':''}</span>
              <strong>{test.title}</strong>
              <p>{test.result||test.description}</p>
            </div>
            <Button variant="secondary" onClick={()=>runOne(test.id)} disabled={test.status==='running'}>
              {test.status==='running'?'Executando':'Testar'}
            </Button>
          </div>)}
        </div>
      </article>

      <div className="rc-side-column">
        <article className="panel-card migration-card">
          <ShieldCheck/>
          <h2>Migração de dados</h2>
          <p>Schema local atual: v{getCurrentSchemaVersion()}.</p>
          <Button onClick={migrate}>Executar migrações</Button>
        </article>

        <article className="panel-card">
          <h2>Notas da versão</h2>
          <form className="rc-note-form" onSubmit={submitNote}>
            <select value={noteType} onChange={(event)=>setNoteType(event.target.value as ReleaseNote['type'])}>
              {Object.entries(noteLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
            </select>
            <textarea value={noteText} onChange={(event)=>setNoteText(event.target.value)} placeholder="Descreva a alteração..."/>
            <Button>Adicionar nota</Button>
          </form>
          <div className="release-note-list">
            {notes.map((note)=><div key={note.id} className={`note-${note.type}`}>
              <div><span>{noteLabels[note.type]}</span><p>{note.text}</p></div>
              <button type="button" onClick={()=>removeNote(note.id)}><Trash2 size={15}/></button>
            </div>)}
          </div>
        </article>
      </div>
    </section>

    <article className="panel-card rc-warning">
      <Rocket/>
      <div>
        <strong>Critério de lançamento</strong>
        <p>Esta RC só deve seguir para clientes-piloto após todos os testes críticos passarem, backup ser validado e infraestrutura externa ser configurada.</p>
      </div>
    </article>
  </div>
}
