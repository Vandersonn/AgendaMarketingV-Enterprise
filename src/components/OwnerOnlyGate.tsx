import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../lib/authStore'
import { LICENSE_OWNER_EMAIL } from '../lib/licenseAuthorityStore'

export function OwnerOnlyGate({ children }: { children: ReactNode }) {
  const email = useAuthStore((state) => state.user?.email?.toLowerCase() ?? '')
  if (email !== LICENSE_OWNER_EMAIL) return <Navigate to="/" replace />
  return <>{children}</>
}
