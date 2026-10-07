import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './pages/Landing'
import './index.css'

const host = document.getElementById('landing-sections')

if (host) {
  createRoot(host).render(
    <StrictMode>
      <Landing />
    </StrictMode>,
  )
}