import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAppNotifications } from '../../../hooks/useAppNotifications'
import { useNotificationsStore } from '../../../lib/notificationsStore'
import { useNavigate } from 'react-router-dom'

export function NotificationsPage() {
  const navigate = useNavigate()
  const notifications = useAppNotifications()
  const markRead = useNotificationsStore((state) => state.markRead)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const clearManual = useNotificationsStore((state) => state.clearManual)
  const unread = notifications.filter((item) => !item.read)

  function open(id: string, path: string) {
    markRead(id)
    navigate(path)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CENTRAL DE ALERTAS</span>
          <h1>Notificações</h1>
          <p>Acompanhe tarefas, cobranças, conteúdos, compromissos e follow-ups.</p>
        </div>

        <div className="actions">
          <Button
            variant="secondary"
            onClick={() => markAllRead(notifications.map((item) => item.id))}
            disabled={!unread.length}
          >
            <CheckCheck size={17} /> Marcar todas como lidas
          </Button>
          <Button variant="danger" onClick={clearManual}>
            <Trash2 size={17} /> Limpar avisos manuais
          </Button>
        </div>
      </header>

      <section className="notification-summary">
        <article className="panel-card">
          <Bell size={24} />
          <span>Total</span>
          <strong>{notifications.length}</strong>
        </article>
        <article className="panel-card">
          <span>Não lidas</span>
          <strong>{unread.length}</strong>
        </article>
        <article className="panel-card">
          <span>Financeiro</span>
          <strong>{notifications.filter((item) => item.type === 'finance').length}</strong>
        </article>
        <article className="panel-card">
          <span>Tarefas e agenda</span>
          <strong>{notifications.filter((item) => item.type === 'tasks' || item.type === 'calendar').length}</strong>
        </article>
      </section>

      <article className="panel-card notification-center-card">
        <div className="notification-center-list">
          {notifications.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`notification-center-item ${item.read ? 'read' : 'unread'} type-${item.type}`}
              onClick={() => open(item.id, item.path)}
            >
              <span className="notification-dot" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small>
              </div>
              <em>{item.read ? 'Lida' : 'Nova'}</em>
            </button>
          ))}

          {!notifications.length && (
            <div className="notification-empty large">
              <Bell size={38} />
              <strong>Nenhuma notificação</strong>
              <span>O sistema está sem pendências no momento.</span>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
