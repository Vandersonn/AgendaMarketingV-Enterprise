import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const CrmPage = lazy(() => import('./pages/CrmPage').then((module) => ({ default: module.CrmPage })))
const ContactCampaignsPage = lazy(() => import('./pages/ContactCampaignsPage').then((module) => ({ default: module.ContactCampaignsPage })))
const FollowUpsPage = lazy(() => import('./pages/FollowUpsPage').then((module) => ({ default: module.FollowUpsPage })))
const CommercialSlaPage = lazy(() => import('./pages/CommercialSlaPage').then((module) => ({ default: module.CommercialSlaPage })))
const LeadDistributionPage = lazy(() => import('./pages/LeadDistributionPage').then((module) => ({ default: module.LeadDistributionPage })))
const LeadScoringPage = lazy(() => import('./pages/LeadScoringPage').then((module) => ({ default: module.LeadScoringPage })))
const CrmIntelligencePage = lazy(() => import('./pages/CrmIntelligencePage').then((module) => ({ default: module.CrmIntelligencePage })))
const SalesPage = lazy(() => import('./pages/SalesPage').then((module) => ({ default: module.SalesPage })))
const SalesOperationsPage = lazy(() => import('./pages/SalesOperationsPage').then((module) => ({ default: module.SalesOperationsPage })))

export const routes: ModuleRoute[] = [
  { path: '/crm', component: CrmPage, permission: 'crm.view' },
  { path: '/contact-campaigns', component: ContactCampaignsPage, permission: 'crm.view' },
  { path: '/follow-ups', component: FollowUpsPage, permission: 'crm.view' },
  { path: '/commercial-sla', component: CommercialSlaPage, permission: 'crm.view' },
  { path: '/lead-distribution', component: LeadDistributionPage, permission: 'crm.view' },
  { path: '/lead-scoring', component: LeadScoringPage, permission: 'crm.view' },
  { path: '/crm-intelligence', component: CrmIntelligencePage, permission: 'crm.view' },
  { path: '/sales', component: SalesPage, permission: 'crm.view' },
  { path: '/sales-workspace', component: SalesOperationsPage, permission: 'crm.view' },
]
