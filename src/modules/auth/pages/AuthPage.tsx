import { useState } from 'react'
import { BarChart3, CalendarDays, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAuthStore } from '../../../lib/authStore'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const recoverPassword = useAuthStore((state) => state.recoverPassword)

  async function recover() {
    if (!email) {
      setMessage('Informe seu e-mail.')
      return
    }
    const result = await recoverPassword(email)
    setMessage(result ?? 'Enviamos as instruções de recuperação para seu e-mail.')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    const error = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, name)
    if (error) {
      setMessage(error)
      return
    }
    if (mode === 'register') {
      setMode('login')
      setMessage('Conta criada. Entre com seus dados.')
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="hero-badge">DEVVANDERSONAPPS • AgendaMarketingV</div>
        <h1>Marketing, CRM e operação em uma única plataforma.</h1>
        <p>Uma base segura para crescer do desktop para a nuvem, com módulos profissionais e integrações oficiais.</p>

        <div className="hero-features">
          <div><ShieldCheck /><span>Autenticação segura</span></div>
          <div><BarChart3 /><span>Dashboards e indicadores</span></div>
          <div><CalendarDays /><span>Agenda operacional</span></div>
          <div><Sparkles /><span>Preparado para IA e automações</span></div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-mark">AMV</div>
            <div>
              <strong>DEVVANDERSONAPPS</strong>
              <span>AgendaMarketingV Enterprise</span>
            </div>
          </div>

          <h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          <p>{mode === 'login' ? 'Entre para acessar seu painel.' : 'Comece sua jornada na plataforma.'}</p>

          <div className="auth-tabs">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Cadastrar</button>
          </div>

          {message && <div className="form-message">{message}</div>}

          <form onSubmit={submit} className="form-grid">
            {mode === 'register' && (
              <label className="full">
                Nome completo
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            )}

            <label className="full">
              E-mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>

            <label className="full">
              Senha
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            </label>

            <Button className="full auth-submit">{mode === 'login' ? 'Entrar' : 'Criar conta'}</Button>
            {mode === 'login' && (
              <button type="button" className="forgot-link full" onClick={recover}>Esqueci minha senha</button>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}
