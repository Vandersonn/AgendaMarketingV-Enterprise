import { useState } from 'react'
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useSecurityCenterStore } from '../../../lib/securityCenterStore'

export function SecurityCenterPage(){
  const{settings,update,review}=useSecurityCenterStore()
  const[score,setScore]=useState<number|null>(null)
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">SEGURANÇA ENTERPRISE</span><h1>Central de segurança</h1><p>Políticas de sessão, senha e preparação para 2FA.</p></div><Button onClick={()=>setScore(review())}><ShieldCheck size={17}/> Executar revisão</Button></header>
    {score!==null&&<section className="security-score panel-card"><ShieldCheck/><div><span>Pontuação</span><strong>{score}/100</strong></div></section>}
    <section className="settings-grid">
      <article className="panel-card"><h2>Políticas</h2><div className="security-form"><label>Expiração da sessão<input type="number" min="10" max="480" value={settings.sessionTimeoutMinutes} onChange={(event)=>update({sessionTimeoutMinutes:Number(event.target.value)})}/></label><label>Bloquear após tentativas<input type="number" min="3" max="20" value={settings.lockAfterFailedAttempts} onChange={(event)=>update({lockAfterFailedAttempts:Number(event.target.value)})}/></label><label className="checkbox-label"><input type="checkbox" checked={settings.requireStrongPassword} onChange={(event)=>update({requireStrongPassword:event.target.checked})}/> Exigir senha forte</label><label className="checkbox-label"><input type="checkbox" checked={settings.twoFactorPrepared} onChange={(event)=>update({twoFactorPrepared:event.target.checked})}/> Ambiente preparado para 2FA</label></div></article>
      <article className="panel-card"><h2>Capacidades</h2><div className="security-capabilities single"><div><KeyRound/><strong>Senha forte</strong><span>Política configurável.</span></div><div><LockKeyhole/><strong>Sessão controlada</strong><span>Expiração definida.</span></div><div><ShieldCheck/><strong>Auditoria</strong><span>Logs técnicos preservados.</span></div></div><div className="security-note"><LockKeyhole/><p>2FA real exige backend e segredo TOTP protegido.</p></div></article>
    </section>
  </div>
}
