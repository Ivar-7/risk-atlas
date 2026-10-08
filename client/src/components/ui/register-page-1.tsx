import { useState, type FormEvent } from 'react'
import { EyeIcon, EyeOffIcon, Lock, Mail, UserRound } from 'lucide-react'
import { navigate } from '@/App'
import { registerAccount } from '@/features/auth/api'
import { Button } from './button'
import { Card } from './card'
import { HomeBackButton } from './home-back-button'
import { Input } from './input'

export function RegisterPage1() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    const confirmation = String(data.get('confirm-password') ?? '')

    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await registerAccount(String(data.get('name')), String(data.get('email')), password)
      navigate('/dashboard')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create account')
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
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-center text-sm">Get access to the Nairobi flood model workspace.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="relative">
              <label className="sr-only" htmlFor="register-name">Full name</label>
              <Input id="register-name" name="name" type="text" autoComplete="name" placeholder="Full name" className="h-10 bg-transparent ps-10 text-sm" required />
              <UserRound className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="register-email">Work email</label>
              <Input id="register-email" name="email" type="email" autoComplete="email" placeholder="Work email" className="h-10 bg-transparent ps-10 text-sm" required />
              <Mail className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="register-password">Password</label>
              <Input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Password (8+ chars)" minLength={8} className="h-10 bg-transparent ps-10 pe-10 text-sm" required />
              <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
              <Button type="button" variant="ghost" className="absolute end-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeIcon className="text-muted-foreground size-5" aria-hidden="true" /> : <EyeOffIcon className="text-muted-foreground size-5" aria-hidden="true" />}
              </Button>
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="register-confirm-password">Confirm password</label>
              <Input id="register-confirm-password" name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirm password" minLength={8} className="h-10 bg-transparent ps-10 text-sm" required aria-invalid={Boolean(error)} aria-describedby={error ? 'register-error' : undefined} />
              <Lock className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
            </div>
            {error && <p id="register-error" role="alert" className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={submitting} className="h-10 w-full">{submitting ? 'Creating account…' : 'Create account'}</Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">Already have an account? <a href="/login/" className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Sign in</a></p>
        </Card>
      </div>
    </section>
  )
}

export default RegisterPage1
