import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from './App'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} signInUrl="/login/" signUpUrl="/register/" signInFallbackRedirectUrl="/dashboard/" signUpFallbackRedirectUrl="/dashboard/" afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-sm text-foreground">Set VITE_CLERK_PUBLISHABLE_KEY in client/.env to start Risk Atlas.</main>
    )}
  </StrictMode>,
)
