import { lazy } from 'react'
import type { ModuleRoute } from '../../app/moduleRoute'

const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })))
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((module) => ({ default: module.DocumentsPage })))
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((module) => ({ default: module.ApprovalsPage })))
const ContractsPage = lazy(() => import('./pages/ContractsPage').then((module) => ({ default: module.ContractsPage })))
const ProposalBuilderPage = lazy(() => import('./pages/ProposalBuilderPage').then((module) => ({ default: module.ProposalBuilderPage })))

export const routes: ModuleRoute[] = [
  { path: '/calendar', component: CalendarPage },
  { path: '/tasks', component: TasksPage, permission: 'tasks.view' },
  { path: '/projects', component: ProjectsPage, permission: 'tasks.view', licenseFeature: 'projects' },
  { path: '/notifications', component: NotificationsPage },
  { path: '/documents', component: DocumentsPage },
  { path: '/approvals', component: ApprovalsPage },
  { path: '/contracts', component: ContractsPage },
  { path: '/proposal-builder', component: ProposalBuilderPage },
]
