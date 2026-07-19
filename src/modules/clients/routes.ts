import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const ClientsPage = lazy(() => import('./pages/ClientsPage').then((module) => ({ default: module.ClientsPage })))
const Client360Page = lazy(() => import('./pages/Client360Page').then((module) => ({ default: module.Client360Page })))
const ClientHealthPage = lazy(() => import('./pages/ClientHealthPage').then((module) => ({ default: module.ClientHealthPage })))
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage').then((module) => ({ default: module.ClientPortalPage })))
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage').then((module) => ({ default: module.OrganizationsPage })))

export const routes: ModuleRoute[] = [
  { path: '/clients', component: ClientsPage, permission: 'clients.view' },
  { path: '/client-360', component: Client360Page },
  { path: '/client-health', component: ClientHealthPage, permission: 'clients.view' },
  { path: '/client-portal', component: ClientPortalPage },
  { path: '/organizations', component: OrganizationsPage, permission: 'settings.manage', licenseFeature: 'multi_company' },
]
