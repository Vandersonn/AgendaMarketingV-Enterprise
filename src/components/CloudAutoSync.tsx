import { useEffect } from 'react'
import { useCloudProvidersStore, type CloudProviderId } from '../lib/cloudProvidersStore'

export function CloudAutoSync() {
  const providers = useCloudProvidersStore((state) => state.providers)
  const syncNow = useCloudProvidersStore((state) => state.syncNow)

  useEffect(() => {
    const timers: number[] = []

    ;(['proton-drive', 'google-drive'] as CloudProviderId[]).forEach((id) => {
      const provider = providers[id]
      if (!provider.enabled || !provider.connected || !provider.automaticBackup) return

      const interval = Math.max(15, provider.intervalMinutes) * 60 * 1000
      const timer = window.setInterval(() => {
        syncNow(id).catch(() => undefined)
      }, interval)
      timers.push(timer)
    })

    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [
    providers['proton-drive'].enabled,
    providers['proton-drive'].connected,
    providers['proton-drive'].automaticBackup,
    providers['proton-drive'].intervalMinutes,
    providers['google-drive'].enabled,
    providers['google-drive'].connected,
    providers['google-drive'].automaticBackup,
    providers['google-drive'].intervalMinutes,
    syncNow
  ])

  return null
}
