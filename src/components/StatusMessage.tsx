interface StatusMessageProps {
  message: string
  tone?: 'success' | 'warning' | 'error' | 'info'
  onClose?: () => void
}

export function StatusMessage({ message, tone = 'info', onClose }: StatusMessageProps) {
  if (!message) return null
  return (
    <div className={`status-message ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onClose && <button type="button" onClick={onClose} aria-label="Fechar mensagem">×</button>}
    </div>
  )
}
