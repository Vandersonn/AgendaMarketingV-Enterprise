import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage').then((module) => ({ default: module.IntegrationsPage })))
const IntegrationHubPage = lazy(() => import('./pages/IntegrationHubPage').then((module) => ({ default: module.IntegrationHubPage })))
const CloudSyncPage = lazy(() => import('./pages/CloudSyncPage').then((module) => ({ default: module.CloudSyncPage })))
const CloudConnectPage = lazy(() => import('./pages/CloudConnectPage').then((module) => ({ default: module.CloudConnectPage })))
const AppCenterPage = lazy(() => import('./pages/AppCenterPage').then((module) => ({ default: module.AppCenterPage })))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then((module) => ({ default: module.MarketplacePage })))
const ContactsSyncPage = lazy(() => import('./pages/ContactsSyncPage').then((module) => ({ default: module.ContactsSyncPage })))
const PluginManagerPage = lazy(() => import('./pages/PluginManagerPage').then((module) => ({ default: module.PluginManagerPage })))

export const routes: ModuleRoute[] = [
  { path: '/integrations', component: IntegrationsPage, permission: 'integrations.manage' },
  { path: '/integration-hub', component: IntegrationHubPage, permission: 'integrations.manage', licenseFeature: 'integrations' },
  { path: '/cloud-sync', component: CloudSyncPage, permission: 'settings.manage' },
  { path: '/cloud-connect', component: CloudConnectPage, permission: 'settings.manage' },
  { path: '/app-center', component: AppCenterPage },
  { path: '/contacts-sync', component: ContactsSyncPage, permission: 'integrations.manage' },
  { path: '/marketplace', component: MarketplacePage, permission: 'settings.manage' },
  { path: '/plugin-manager', component: PluginManagerPage, permission: 'settings.manage' },
]
