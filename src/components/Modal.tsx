import { useEffect, useId, useRef, type PropsWithChildren } from 'react'

interface Props {
  title: string
  open: boolean
  onClose: () => void
  initialFocusSelector?: string
}

const focusableSelector = [
  '[autofocus]',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

export function Modal({ title, open, onClose, initialFocusSelector, children }: PropsWithChildren<Props>) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  // A função recebida pode ser recriada durante a digitação. Guardá-la em ref
  // impede que o efeito de foco seja desmontado e remontado a cada caractere.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () => Array.from(
      cardRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
    ).filter((element) => element.offsetParent !== null && element.getAttribute('aria-hidden') !== 'true')

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (!focusable.length) {
        event.preventDefault()
        cardRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handler)

    // Executado somente na transição fechado -> aberto. Nunca depende do
    // conteúdo digitado nem da identidade de callbacks do componente pai.
    const focusTimer = window.setTimeout(() => {
      const selected = initialFocusSelector
        ? cardRef.current?.querySelector<HTMLElement>(initialFocusSelector)
        : null
      const firstField = selected ?? getFocusable()[0]
      ;(firstField ?? cardRef.current)?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = previousOverflow
      if (previous?.isConnected) previous.focus()
    }
  }, [open, initialFocusSelector])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current()
      }}
    >
      <div
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={() => onCloseRef.current()} aria-label="Fechar janela">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
