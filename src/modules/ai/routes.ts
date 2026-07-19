import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const AiStudioPage = lazy(() => import('./pages/AiStudioPage').then((module) => ({ default: module.AiStudioPage })))
const AiAgentsPage = lazy(() => import('./pages/AiAgentsPage').then((module) => ({ default: module.AiAgentsPage })))
const AiExecutivePage = lazy(() => import('./pages/AiExecutivePage').then((module) => ({ default: module.AiExecutivePage })))

export const routes: ModuleRoute[] = [
  { path: '/ai-studio', component: AiStudioPage },
  { path: '/ai-agents', component: AiAgentsPage, permission: 'dashboard.view', licenseFeature: 'ai' },
  { path: '/ai-executive', component: AiExecutivePage, permission: 'dashboard.view' },
]
