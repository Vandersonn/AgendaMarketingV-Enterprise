import { useEffect } from 'react'

export function useUnsavedChanges(active: boolean, message = 'Existem alterações não salvas.') {
  useEffect(() => {
    if (!active) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = message
      return message
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [active, message])
}
