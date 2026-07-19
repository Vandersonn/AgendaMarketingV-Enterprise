import type { ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLicenseStore } from '../lib/licenseStore'
import { planHasFeature } from '../lib/planFeatures'
import { Button } from './Button'

export function LicenseGuard({ feature, children }: { feature: string; children: ReactNode }) {
  const navigate = useNavigate()
  const license = useLicenseStore((state) => state.license)
  const expired = Boolean(license.expiresAt) && new Date(license.expiresAt).getTime() < Date.now()
  const allowed = !expired && license.status !== 'blocked' && planHasFeature(license.plan, feature)

  if (!allowed) {
    return <div className="page">
      <article className="panel-card access-denied">
        <LockKeyhole size={42}/>
        <h1>Recurso indisponível</h1>
        <p>Este módulo não está incluído no plano atual ou a licença expirou.</p>
        <Button onClick={() => navigate('/license')}>Abrir Central de Licença</Button>
      </article>
    </div>
  }

  return <>{children}</>
}
