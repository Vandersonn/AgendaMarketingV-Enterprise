import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const MarketingPage = lazy(() => import('./pages/MarketingPage').then((module) => ({ default: module.MarketingPage })))
const ContentCalendarPage = lazy(() => import('./pages/ContentCalendarPage').then((module) => ({ default: module.ContentCalendarPage })))
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage').then((module) => ({ default: module.WhatsAppPage })))
const AutomationsPage = lazy(() => import('./pages/AutomationsPage').then((module) => ({ default: module.AutomationsPage })))
const AutomationSuggestionsPage = lazy(() => import('./pages/AutomationSuggestionsPage').then((module) => ({ default: module.AutomationSuggestionsPage })))

export const routes: ModuleRoute[] = [
  { path: '/marketing', component: MarketingPage, permission: 'marketing.view' },
  { path: '/content-calendar', component: ContentCalendarPage },
  { path: '/whatsapp', component: WhatsAppPage },
  { path: '/automations', component: AutomationsPage },
  { path: '/automation-suggestions', component: AutomationSuggestionsPage, permission: 'dashboard.view' },
]
