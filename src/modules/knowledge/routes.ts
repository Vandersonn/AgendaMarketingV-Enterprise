import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const ManualPage = lazy(() => import('./pages/ManualPage').then((module) => ({ default: module.ManualPage })))
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then((module) => ({ default: module.KnowledgeBasePage })))
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })))
const ServiceCatalogPage = lazy(() => import('./pages/ServiceCatalogPage').then((module) => ({ default: module.ServiceCatalogPage })))
const UpdatesPage = lazy(() => import('./pages/UpdatesPage').then((module) => ({ default: module.UpdatesPage })))

export const routes: ModuleRoute[] = [
  { path: '/manual', component: ManualPage },
  { path: '/knowledge', component: KnowledgeBasePage },
  { path: '/support', component: SupportPage, permission: 'tasks.view' },
  { path: '/services', component: ServiceCatalogPage, permission: 'settings.manage' },
  { path: '/updates', component: UpdatesPage },
]
