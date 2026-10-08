import { useState, type FormEvent } from 'react'
import { EyeIcon, EyeOffIcon, Lock, Mail } from 'lucide-react'
import { navigate } from '@/App'
import { loginAccount } from '@/features/auth/api'
import { Button } from './button'
import { Card } from './card'
import { HomeBackButton } from './home-back-button'
import { Input } from './input'

export function LoginPage1() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError('')
    setSubmitting(true)
    try {
      await loginAccount(String(data.get('email')), String(data.get('password')))
      navigate('/dashboard')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="from-background to-muted/50 relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-linear-to-br">
      <HomeBackButton />
      <div className="relative z-10 container mx-auto flex min-h-dvh items-center justify-center px-4 py-20">
        <Card className="relative w-full max-w-md ring-0 p-8 shadow-2xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="my-4 flex justify-center">
              <div className="bg-secondary relative size-14 overflow-hidden rounded-xl border border-border/60">
                <img src="/assets/icon-192.png" alt="Risk Atlas" className="size-full object-cover" />
              </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-center text-sm">Sign in to your Risk Atlas account.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="relative">
              <label className="sr-only" htmlFor="login-email">Email address</label>
              <Input id="login-email" name="email" type="email" autoComplete="email" placeholder="Work email" className="h-10 bg-transparent ps-10 text-sm" required />
              <Mail className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="login-password">Password</label>
              <Input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" className="h-10 bg-transparent ps-10 pe-10 text-sm" required />
              <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
              <Button type="button" variant="ghost" className="absolute end-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeIcon className="text-muted-foreground size-5" aria-hidden="true" /> : <EyeOffIcon className="text-muted-foreground size-5" aria-hidden="true" />}
              </Button>
            </div>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={submitting} className="h-10 w-full">{submitting ? 'Signing in…' : 'Sign in'}</Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">New to Risk Atlas? <a href="/register/" className="text-foreground inline-block underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Create an account</a></p>
        </Card>
      </div>
    </section>
  )
}

export default LoginPage1
