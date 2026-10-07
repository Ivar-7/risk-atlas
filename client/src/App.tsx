import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

export function navigate(path: string) {
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'instant' })
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onLocation = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onLocation)
    return () => window.removeEventListener('popstate', onLocation)
  }, [])

  useEffect(() => {
    document.title = path === '/login' ? 'Risk Atlas — Sign in' : path === '/dashboard' ? 'Risk Atlas — Nairobi Flood Dashboard' : 'Risk Atlas — Nairobi Flood Catastrophe Model'
  }, [path])

  if (path === '/login') return <LoginPage />
  if (path === '/dashboard') return <DashboardPage />
  return <LandingPage />
}
