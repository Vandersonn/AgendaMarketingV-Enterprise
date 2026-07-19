import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './app/ProtectedRoute'
import { appRoutes } from './app/routes'
import { Layout } from './components/Layout'
import { useAuthStore } from './lib/authStore'
import { AuthPage } from './modules/auth'

const loadingFallback = <div className="loading-screen">Carregando módulo...</div>

export function App() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  if (loading) return <div className="loading-screen">Carregando AgendaMarketingV...</div>
  if (!user) return <AuthPage />

  return (
    <Suspense fallback={loadingFallback}>
      <Routes>
        <Route element={<Layout />}>
          {appRoutes.map(({ component: Page, permission, licenseFeature, ownerOnly, ...route }) => (
            <Route
              key={route.index ? 'index' : route.path}
              {...route}
              element={
                <ProtectedRoute permission={permission} licenseFeature={licenseFeature} ownerOnly={ownerOnly}>
                  <Page />
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
