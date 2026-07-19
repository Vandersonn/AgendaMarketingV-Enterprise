import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const FinancePage = lazy(() => import('./pages/FinancePage').then((module) => ({ default: module.FinancePage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))

export const routes: ModuleRoute[] = [
  { path: '/finance', component: FinancePage, permission: 'finance.view', licenseFeature: 'finance' },
  { path: '/reports', component: ReportsPage, permission: 'reports.view' },
]
