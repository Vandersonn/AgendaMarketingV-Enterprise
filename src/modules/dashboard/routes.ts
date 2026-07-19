import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ExecutiveDashboardPage = lazy(() => import('./pages/ExecutiveDashboardPage').then((module) => ({ default: module.ExecutiveDashboardPage })))
const WidgetDashboardPage = lazy(() => import('./pages/WidgetDashboardPage').then((module) => ({ default: module.WidgetDashboardPage })))
const MetricsPage = lazy(() => import('./pages/MetricsPage').then((module) => ({ default: module.MetricsPage })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((module) => ({ default: module.GoalsPage })))
const MissionsPage = lazy(() => import('./pages/MissionsPage').then((module) => ({ default: module.MissionsPage })))

export const routes: ModuleRoute[] = [
  { index: true, component: DashboardPage, permission: 'dashboard.view' },
  { path: '/executive', component: ExecutiveDashboardPage, permission: 'dashboard.view' },
  { path: '/workspace', component: WidgetDashboardPage, permission: 'dashboard.view' },
  { path: '/metrics', component: MetricsPage },
  { path: '/goals', component: GoalsPage, permission: 'dashboard.view' },
  { path: '/missions', component: MissionsPage, permission: 'dashboard.view' },
]
