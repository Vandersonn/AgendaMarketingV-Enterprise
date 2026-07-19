import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const LicenseCenterPage = lazy(() => import('./pages/LicenseCenterPage').then((module) => ({ default: module.LicenseCenterPage })))
const LicenseAuthorityPage = lazy(() => import('./pages/LicenseAuthorityPage').then((module) => ({ default: module.LicenseAuthorityPage })))
const LicensingControlPage = lazy(() => import('./pages/LicensingControlPage').then((module) => ({ default: module.LicensingControlPage })))
const DevvandersonPortalPage = lazy(() => import('./pages/DevvandersonPortalPage').then((module) => ({ default: module.DevvandersonPortalPage })))

export const routes: ModuleRoute[] = [
  { path: '/license', component: LicenseCenterPage },
  { path: '/license-authority', component: LicenseAuthorityPage, ownerOnly: true },
  { path: '/licensing-control', component: LicensingControlPage, ownerOnly: true },
  { path: '/devvanderson-portal', component: DevvandersonPortalPage, ownerOnly: true },
]
