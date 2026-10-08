import { SignIn, SignUp } from '@clerk/react'
import { HomeBackButton } from './home-back-button'

const appearance = {
  variables: {
    colorPrimary: '#a7f3d0',
    colorBackground: '#141416',
    colorForeground: '#f4f5f4',
    colorMutedForeground: '#9ba3a0',
    colorInput: '#101112',
    colorInputForeground: '#f4f5f4',
    colorPrimaryForeground: '#050807',
    colorNeutral: '#9ba3a0',
    colorRing: '#a78bfa',
    borderRadius: '0.625rem',
  },
  elements: {
    cardBox: 'shadow-2xl',
    card: 'border border-[#26282b]',
  },
}

export function ClerkAuthPage({ mode }: { mode: 'login' | 'register' }) {
  return (
    <main className="from-background to-muted/50 relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-linear-to-br [color-scheme:dark]">
      <HomeBackButton />
      <div className="flex min-h-dvh w-full flex-col items-center justify-center px-4 py-20">
        <a href="/" className="mb-5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring" aria-label="Risk Atlas home">
          <img src="/assets/icon-192.png" alt="Risk Atlas" className="size-14 rounded-xl border border-border/60 object-cover" />
        </a>
        {mode === 'login' ? (
          <SignIn routing="hash" signUpUrl="/register/" fallbackRedirectUrl="/dashboard/" appearance={appearance} />
        ) : (
          <SignUp routing="hash" signInUrl="/login/" fallbackRedirectUrl="/dashboard/" appearance={appearance} />
        )}
      </div>
    </main>
  )
}
