import { lazy, Suspense } from 'react'
import LoginPage from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ModelPage = lazy(() => import('./pages/ModelPage'))

export function navigate(path: string) {
  window.location.assign(path === '/' ? '/' : `${path.replace(/\/$/, '')}/`)
}

export default function App() {
  if (window.location.pathname.startsWith('/login')) return <LoginPage />
  if (window.location.pathname.startsWith('/dashboard')) {
    return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0c1013] text-sm text-white/60">Loading Risk Atlas workspace…</div>}><DashboardPage /></Suspense>
  }
  if (window.location.pathname.startsWith('/app')) {
    return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0c1013] text-sm text-white/60">Loading model workspace…</div>}><ModelPage /></Suspense>
  }
  return null
}
