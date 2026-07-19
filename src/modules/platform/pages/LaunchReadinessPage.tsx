import { CheckCircle2, CircleAlert, Rocket, ShieldCheck } from 'lucide-react'
import { useBackupStore } from '../../../lib/backupStore'
import { useCloudSyncStore } from '../../../lib/cloudSyncStore'
import { useIntegrationHubStore } from '../../../lib/integrationHubStore'
import { useLicenseStore } from '../../../lib/licenseStore'
import { useSecurityCenterStore } from '../../../lib/securityCenterStore'
import { runSystemDiagnostics } from '../../../lib/systemDiagnostics'

export function LaunchReadinessPage(){
  const license=useLicenseStore((state)=>state.license)
  const backups=useBackupStore((state)=>state.snapshots)
  const connections=useIntegrationHubStore((state)=>state.connections)
  const syncEnabled=useCloudSyncStore((state)=>state.enabled)
  const security=useSecurityCenterStore((state)=>state.settings)
  const diagnostics=runSystemDiagnostics()
  const checks=[
    {label:'Build e tratamento de erros',ok:true,detail:'ErrorBoundary e inicialização segura.'},
    {label:'Licenciamento',ok:['active','trial'].includes(license.status),detail:`Plano ${license.plan} • ${license.status}`},
    {label:'Backup',ok:backups.length>0,detail:backups.length?`${backups.length} snapshot(s)`:'Crie um backup.'},
    {label:'Saúde do sistema',ok:!diagnostics.some((item)=>item.status==='critical'),detail:`${diagnostics.filter((item)=>item.status==='critical').length} item(ns) crítico(s)`},
    {label:'Integrações',ok:connections.some((item)=>item.status==='connected'),detail:`${connections.length} conexão(ões) cadastrada(s)`},
    {label:'Sincronização',ok:syncEnabled,detail:syncEnabled?'Fila habilitada.':'Sincronização desativada.'},
    {label:'Senha forte',ok:security.requireStrongPassword,detail:'Política ativa.'},
    {label:'Preparação 2FA',ok:security.twoFactorPrepared,detail:security.twoFactorPrepared?'Preparado.':'Backend ainda pendente.'},
    {label:'Assinatura digital',ok:false,detail:'Requer certificado de código.'},
    {label:'Servidor de atualização',ok:false,detail:'Conectar releases assinadas.'}
  ]
  const completed=checks.filter((item)=>item.ok).length
  const score=Math.round(completed/checks.length*100)
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">AGENDA MARKETING V 1.0</span><h1>Prontidão para lançamento</h1><p>Checklist técnico e comercial antes de vender.</p></div></header>
    <section className="launch-hero panel-card"><div className={`launch-score ${score<70?'warning':''}`}><strong>{score}</strong><span>%</span></div><div><Rocket/><h2>{score>=80?'Próximo do lançamento':'Ainda existem pendências'}</h2><p>{completed} de {checks.length} requisitos atendidos.</p></div></section>
    <section className="launch-checklist">{checks.map((check)=><article key={check.label} className={`panel-card ${check.ok?'ready':'pending'}`}>{check.ok?<CheckCircle2/>:<CircleAlert/>}<div><strong>{check.label}</strong><span>{check.detail}</span></div></article>)}</section>
    <article className="panel-card launch-warning"><ShieldCheck/><div><strong>Importante</strong><p>Licenciamento local, update simulado e fila cloud não substituem backend seguro, assinatura digital e testes-piloto.</p></div></article>
  </div>
}
