import type { ReactNode } from 'react'
import { LicenseGuard } from '../components/LicenseGuard'
import { OwnerOnlyGate } from '../components/OwnerOnlyGate'
import { PermissionGate } from '../components/PermissionGate'
import type { ModuleRoute } from './moduleRoute'

interface ProtectedRouteProps extends Pick<ModuleRoute, 'permission' | 'licenseFeature' | 'ownerOnly'> {
  children: ReactNode
}

export function ProtectedRoute({ children, permission, licenseFeature, ownerOnly }: ProtectedRouteProps) {
  let content = children

  if (licenseFeature) content = <LicenseGuard feature={licenseFeature}>{content}</LicenseGuard>
  if (permission) content = <PermissionGate permission={permission}>{content}</PermissionGate>
  if (ownerOnly) content = <OwnerOnlyGate>{content}</OwnerOnlyGate>

  return <>{content}</>
}
