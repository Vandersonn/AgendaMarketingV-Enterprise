import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Wrench } from 'lucide-react'
import { logSystem } from '../lib/systemLogStore'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

const RECOVERY_KEYS = [
  'amv_professional_ai_agents',
  'amv_professional_backup_center'
]

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Erro inesperado.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AgendaMarketingV render error:', error, info)
    logSystem(
      'error',
      'Interface',
      error.message || 'Erro inesperado de renderização',
      info.componentStack ?? ''
    )
  }

  private recover = () => {
    for (const key of RECOVERY_KEYS) {
      try {
        localStorage.removeItem(key)
      } catch {
        // Continua a recuperação.
      }
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="startup-error-screen">
        <article className="panel-card runtime-error">
          <AlertTriangle size={44} />
          <h1>O aplicativo encontrou um erro</h1>
          <p>A falha foi isolada. Seus clientes, tarefas e dados financeiros não serão apagados.</p>
          <code>{this.state.message}</code>
          <div className="runtime-error-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()} autoFocus>
              <RotateCcw size={17} /> Recarregar
            </button>
            <button type="button" className="btn btn-secondary" onClick={this.recover}>
              <Wrench size={17} /> Recuperar inicialização
            </button>
          </div>
        </article>
      </div>
    )
  }
}
