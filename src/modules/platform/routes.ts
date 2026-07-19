import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage').then((module) => ({ default: module.BusinessProfilePage })))
const TeamPage = lazy(() => import('./pages/TeamPage').then((module) => ({ default: module.TeamPage })))
const AccessControlPage = lazy(() => import('./pages/AccessControlPage').then((module) => ({ default: module.AccessControlPage })))
const AuditPage = lazy(() => import('./pages/AuditPage').then((module) => ({ default: module.AuditPage })))
const SecurityCenterPage = lazy(() => import('./pages/SecurityCenterPage').then((module) => ({ default: module.SecurityCenterPage })))
const SystemHealthPage = lazy(() => import('./pages/SystemHealthPage').then((module) => ({ default: module.SystemHealthPage })))
const LaunchReadinessPage = lazy(() => import('./pages/LaunchReadinessPage').then((module) => ({ default: module.LaunchReadinessPage })))
const ReleaseCandidatePage = lazy(() => import('./pages/ReleaseCandidatePage').then((module) => ({ default: module.ReleaseCandidatePage })))
const DiagnosticCenterPage = lazy(() => import('./pages/DiagnosticCenterPage').then((module) => ({ default: module.DiagnosticCenterPage })))
const ErrorCenterPage = lazy(() => import('./pages/ErrorCenterPage').then((module) => ({ default: module.ErrorCenterPage })))
const PerformanceCenterPage = lazy(() => import('./pages/PerformanceCenterPage').then((module) => ({ default: module.PerformanceCenterPage })))
const RecoveryCenterPage = lazy(() => import('./pages/RecoveryCenterPage').then((module) => ({ default: module.RecoveryCenterPage })))
const EventBusPage = lazy(() => import('./pages/EventBusPage').then((module) => ({ default: module.EventBusPage })))
const PlatformCorePage = lazy(() => import('./pages/PlatformCorePage').then((module) => ({ default: module.PlatformCorePage })))
const GlobalSearchPage = lazy(() => import('./pages/GlobalSearchPage').then((module) => ({ default: module.GlobalSearchPage })))
const TrashPage = lazy(() => import('./pages/TrashPage').then((module) => ({ default: module.TrashPage })))
const WhiteLabelPage = lazy(() => import('./pages/WhiteLabelPage').then((module) => ({ default: module.WhiteLabelPage })))

export const routes: ModuleRoute[] = [
  { path: '/settings', component: SettingsPage, permission: 'settings.manage' },
  { path: '/business-profile', component: BusinessProfilePage, permission: 'settings.manage' },
  { path: '/team', component: TeamPage, permission: 'team.manage' },
  { path: '/access-control', component: AccessControlPage, permission: 'team.manage' },
  { path: '/audit', component: AuditPage, permission: 'audit.view' },
  { path: '/security-center', component: SecurityCenterPage, permission: 'settings.manage' },
  { path: '/system-health', component: SystemHealthPage, permission: 'settings.manage' },
  { path: '/launch-readiness', component: LaunchReadinessPage, permission: 'settings.manage' },
  { path: '/release-candidate', component: ReleaseCandidatePage, permission: 'settings.manage' },
  { path: '/diagnostic-center', component: DiagnosticCenterPage, permission: 'settings.manage' },
  { path: '/error-center', component: ErrorCenterPage, permission: 'settings.manage' },
  { path: '/performance-center', component: PerformanceCenterPage, permission: 'settings.manage' },
  { path: '/recovery-center', component: RecoveryCenterPage, permission: 'settings.manage' },
  { path: '/event-bus', component: EventBusPage, permission: 'settings.manage' },
  { path: '/platform-core', component: PlatformCorePage, permission: 'settings.manage' },
  { path: '/global-search', component: GlobalSearchPage },
  { path: '/trash', component: TrashPage, permission: 'settings.manage' },
  { path: '/white-label', component: WhiteLabelPage, permission: 'settings.manage' },
]
