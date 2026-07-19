import { Bell, CheckCheck, ChevronDown, HelpCircle, Menu, Moon, Plus, Search, Sun, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppNotifications } from '../hooks/useAppNotifications'
import { useAuthStore } from '../lib/authStore'
import { useNotificationsStore } from '../lib/notificationsStore'
import type { ThemeMode } from '../lib/types'

const quickCreate = [
  { label: 'Novo cliente', path: '/clients', intent: 'new-client' },
  { label: 'Novo lead', path: '/crm', intent: 'new-lead' },
  { label: 'Nova tarefa', path: '/tasks', intent: 'new-task' },
  { label: 'Novo projeto', path: '/projects', intent: 'new-project' },
  { label: 'Nova proposta', path: '/proposal-builder', intent: 'new-proposal' },
  { label: 'Novo compromisso', path: '/calendar', intent: 'new-event' },
  { label: 'Novo lançamento financeiro', path: '/finance', intent: 'new-finance' },
  { label: 'Novo conteúdo', path: '/content-calendar', intent: 'new-content' }
]

export function Topbar({ title, onMenuToggle, theme, onThemeToggle }: {
  title: string
  onMenuToggle: () => void
  theme: ThemeMode
  onThemeToggle: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const notifications = useAppNotifications()
  const markRead = useNotificationsStore((state) => state.markRead)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const createRef = useRef<HTMLDivElement>(null)

  const name =
    (user as { name?: string })?.name ||
    (user as { user_metadata?: { full_name?: string } })?.user_metadata?.full_name ||
    user?.email ||
    'Vanderson'

  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const unread = notifications.filter((item) => !item.read)
  const preview = notifications.slice(0, 8)

  useEffect(() => {
    setNotificationsOpen(false)
    setCreateOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        setCreateOpen(false)
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setCreateOpen((value) => !value)
        setNotificationsOpen(false)
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (notificationsOpen && !notificationRef.current?.contains(target) && !bellRef.current?.contains(target)) setNotificationsOpen(false)
      if (createOpen && !createRef.current?.contains(target)) setCreateOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [notificationsOpen, createOpen])

  function openCommandPalette() {
    setNotificationsOpen(false)
    setCreateOpen(false)
    window.dispatchEvent(new CustomEvent('amv:open-command-palette'))
  }

  function createItem(path: string, intent: string) {
    sessionStorage.setItem('amv.quick-create-intent', intent)
    setCreateOpen(false)
    navigate(`${path}?action=new`)
  }

  function openNotification(id: string, path: string) {
    markRead(id)
    setNotificationsOpen(false)
    navigate(path)
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button type="button" className="topbar-icon" onClick={onMenuToggle} aria-label="Alternar menu"><Menu size={21}/></button>
          <h1>{title}</h1>
        </div>

        <button type="button" className="topbar-search" onClick={openCommandPalette}>
          <Search size={18}/><span>Buscar páginas, clientes e ações...</span><kbd>Ctrl + K</kbd>
        </button>

        <div className="topbar-actions">
          <div className="quick-create" ref={createRef}>
            <button type="button" className="quick-create-button" onClick={() => { setCreateOpen((value) => !value); setNotificationsOpen(false) }} aria-expanded={createOpen}>
              <Plus size={18}/><span>Novo</span><ChevronDown size={15}/>
            </button>
            {createOpen && <div className="quick-create-menu" role="menu">
              <div><strong>Criar rapidamente</strong><kbd>Ctrl + N</kbd></div>
              {quickCreate.map((item) => <button type="button" key={item.intent} onClick={() => createItem(item.path, item.intent)}><Plus size={15}/>{item.label}</button>)}
            </div>}
          </div>

          <button type="button" className="topbar-icon" onClick={onThemeToggle} aria-label="Alternar tema">{theme === 'light' ? <Moon size={19}/> : <Sun size={19}/>}</button>
          <button ref={bellRef} type="button" className={`topbar-icon notification ${notificationsOpen ? 'active' : ''}`} onClick={() => { setNotificationsOpen((current) => !current); setCreateOpen(false) }} aria-label="Abrir notificações" aria-expanded={notificationsOpen}>
            <Bell size={19}/>{unread.length > 0 && <span>{unread.length > 99 ? '99+' : unread.length}</span>}
          </button>
          <button type="button" className="topbar-icon" onClick={() => navigate('/manual')} aria-label="Abrir manual"><HelpCircle size={19}/></button>
          <div className="topbar-profile"><div className="profile-avatar">{initials}</div><div><strong>{name}</strong><span>Administrador</span></div></div>
        </div>
      </header>

      {notificationsOpen && <div ref={notificationRef} className="notification-panel" role="dialog" aria-label="Central de notificações">
        <div className="notification-panel-header"><div><strong>Notificações</strong><span>{unread.length} não lida(s)</span></div><div className="notification-header-actions">
          <button type="button" onClick={() => markAllRead(notifications.map((item) => item.id))} disabled={!unread.length} title="Marcar todas como lidas"><CheckCheck size={17}/></button>
          <button type="button" onClick={() => setNotificationsOpen(false)} title="Fechar"><X size={17}/></button>
        </div></div>
        <div className="notification-list">
          {preview.map((item) => <button type="button" key={item.id} className={`notification-item ${item.read ? 'read' : 'unread'} type-${item.type}`} onClick={() => openNotification(item.id, item.path)}><span className="notification-dot"/><div><strong>{item.title}</strong><p>{item.description}</p><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small></div></button>)}
          {!preview.length && <div className="notification-empty"><Bell size={30}/><strong>Nenhuma notificação</strong><span>Novos alertas aparecerão aqui.</span></div>}
        </div>
        <button type="button" className="notification-view-all" onClick={() => { setNotificationsOpen(false); navigate('/notifications') }}>Ver todas as notificações</button>
      </div>}
    </>
  )
}
