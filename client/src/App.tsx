import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/react'
import { setModelTokenProvider } from './features/model/auth-token'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLoader from './components/ui/v-skeleton-8'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function RequireAccount({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, sessionId, getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  const [readySessionId, setReadySessionId] = useState<string | null>(null)
  getTokenRef.current = getToken

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const destination = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)
      window.location.replace(`/login/?redirect_url=${destination}`)
    }
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !sessionId) return
    setModelTokenProvider(() => getTokenRef.current())
    setReadySessionId(sessionId)
    return () => {
      setModelTokenProvider(null)
    }
  }, [isLoaded, isSignedIn, sessionId])

  if (!isLoaded || !isSignedIn || readySessionId !== sessionId) return <DashboardLoader />
  return children
}

function AnonymousOnly({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.replace('/dashboard/')
  }, [isLoaded, isSignedIn])

  if (!isLoaded || isSignedIn) return <DashboardLoader />
  return children
}

export function navigate(path: string) {
  window.location.assign(path === '/' ? '/' : `${path.replace(/\/$/, '')}/`)
}

export default function App() {
  if (window.location.pathname.startsWith('/login')) return <AnonymousOnly><LoginPage /></AnonymousOnly>
  if (window.location.pathname.startsWith('/register')) return <AnonymousOnly><RegisterPage /></AnonymousOnly>
  if (window.location.pathname.startsWith('/dashboard')) {
    return <RequireAccount><Suspense fallback={<DashboardLoader />}><DashboardPage /></Suspense></RequireAccount>
  }
  if (window.location.pathname.startsWith('/app')) {
    window.location.replace('/dashboard/#workspace')
    return <DashboardLoader />
  }
  return null
}
