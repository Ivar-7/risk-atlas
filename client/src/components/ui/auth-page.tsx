'use client'

import { useMemo, type ComponentProps, type CSSProperties, type FormEvent } from 'react'
import { AtSignIcon, ChevronLeftIcon, ShieldCheckIcon } from 'lucide-react'

import { navigate } from '@/App'
import { brand } from '@/content/landing'
import { Button } from './button'
import { Input } from './input'

const PATH_COUNT = 36

/**
 * Sign-in shell for the Risk Atlas workspace.
 *
 * Deliberate deviation from the reference component: the social sign-in buttons
 * are presentational only. There is no auth backend, so rather than implying a
 * working OAuth flow they route to the demo workspace and the note below the
 * form says so plainly. Wiring real providers later means replacing `submit`
 * with the actual handler; nothing else here changes.
 */
export function AuthPage() {
  const openWorkspace = () => navigate('/dashboard')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    openWorkspace()
  }

  return (
    <main className="bg-background relative grid min-h-svh text-foreground lg:grid-cols-2">
      <div className="bg-muted/60 relative hidden border-r lg:flex">
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-svh flex-col justify-center p-4">
        <div
          aria-hidden
          className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
        >
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,var(--color-foreground)_0,transparent_50%)] opacity-[0.06]" />
          <div className="absolute top-0 right-0 h-320 w-60 translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,var(--color-foreground)_0,transparent_80%)] opacity-[0.04]" />
        </div>

        <Button variant="ghost" className="absolute top-7 left-5" asChild>
          <a href={brand.homeHref}>
            <ChevronLeftIcon className="me-2 size-4" aria-hidden="true" />
            Home
          </a>
        </Button>

        <div className="mx-auto w-full space-y-4 sm:w-sm">
          <div className="flex items-center gap-2 lg:hidden">
            <ShieldCheckIcon className="size-6 text-primary" aria-hidden="true" />
            <p className="text-xl font-semibold">{brand.wordmark}</p>
          </div>

          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-wide">Sign in to the workspace</h1>
            <p className="text-muted-foreground text-base">
              Access the Nairobi flood model and synthetic portfolio.
            </p>
          </div>

          <div className="space-y-2">
            <Button type="button" size="lg" className="w-full" onClick={openWorkspace}>
              <GoogleIcon className="me-2 size-4" aria-hidden="true" />
              Continue with Google
            </Button>
            <Button type="button" size="lg" className="w-full" onClick={openWorkspace}>
              <GithubIcon className="me-2 size-4" aria-hidden="true" />
              Continue with GitHub
            </Button>
          </div>

          <AuthSeparator />

          <form className="space-y-2" onSubmit={submit}>
            <label htmlFor="auth-email" className="text-muted-foreground block text-xs">
              Enter your email address to sign in or create an account
            </label>
            <div className="relative h-max">
              <Input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@example.com"
                className="peer ps-9"
              />
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <AtSignIcon className="size-4" aria-hidden="true" />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Continue with Email
            </Button>
          </form>

          <p className="text-muted-foreground mt-8 text-sm">
            Prototype only: authentication is not connected yet. Any option opens the sample
            workspace. See{' '}
            <a
              href={brand.assumptionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              docs/assumptions.md
            </a>{' '}
            for what the model does and does not claim.
          </p>
        </div>
      </div>
    </main>
  )
}

/**
 * Decorative streaming curves.
 *
 * Each line is a dashed stroke whose `stroke-dashoffset` travels one full dash
 * period per cycle, so the motion loops seamlessly. See the `atlas-stream`
 * keyframes in src/index.css for why this is CSS rather than framer-motion.
 *
 * Periods are deliberately coprime with durations so the lines never resync
 * into a visible pulse.
 */
function FloatingPaths({ position }: { position: number }) {
  const paths = useMemo(
    () =>
      Array.from({ length: PATH_COUNT }, (_, i) => {
        // Dash dominates the gap so each curve still reads as a continuous line;
        // the travelling gap is what makes it look like data streaming along it.
        const dash = 150 + (i % 7) * 40
        const gap = 26 + (i % 5) * 11
        return {
          id: i,
          d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${
            189 + i * 6
          } -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${
            343 - i * 6
          }C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${
            875 - i * 6
          } ${684 - i * 5 * position} ${875 - i * 6}`,
          width: 0.5 + i * 0.03,
          opacity: 0.1 + i * 0.03,
          dasharray: `${dash} ${gap}`,
          period: dash + gap,
          duration: 13 + (i % 7) * 2.5,
          delay: -((i * 2.7) % 15),
        }
      }),
    [position],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="h-full w-full text-primary" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            strokeDasharray={path.dasharray}
            className="atlas-stream"
            style={
              {
                '--atlas-period': `${path.period}px`,
                '--atlas-duration': `${path.duration}s`,
                '--atlas-delay': `${path.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  )
}

/** Inline because lucide-react v1 dropped the brand glyphs. */
const GithubIcon = (props: ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.17c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
  </svg>
)

const GoogleIcon = (props: ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
)

const AuthSeparator = () => (
  <div className="flex w-full items-center justify-center" role="separator">
    <div className="bg-border h-px w-full" />
    <span className="text-muted-foreground px-2 text-xs">OR</span>
    <div className="bg-border h-px w-full" />
  </div>
)