import { useEffect, useRef, useState, type FormEvent } from 'react'
import { navigate } from '../../App'
import './neural-access-login.css'

const blobs = [
  { size: 330, left: 12, top: 8, delay: -8, duration: 22 },
  { size: 250, left: 59, top: 5, delay: -15, duration: 29 },
  { size: 350, left: 74, top: 49, delay: -4, duration: 25 },
  { size: 220, left: 7, top: 71, delay: -12, duration: 31 },
  { size: 290, left: 42, top: 72, delay: -19, duration: 27 },
  { size: 190, left: 82, top: 24, delay: -6, duration: 24 },
]

export default function NeuralAccessLogin() {
  const blobRefs = useRef<(HTMLDivElement | null)[]>([])
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5
      const y = event.clientY / window.innerHeight - 0.5

      blobRefs.current.forEach((blob, index) => {
        if (!blob) return
        const distance = (index + 1) * 10
        blob.style.marginLeft = `${x * distance}px`
        blob.style.marginTop = `${y * distance}px`
      })
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/dashboard')
  }

  return (
    <main className="mercury-login">
      <svg className="mercury-filter" aria-hidden="true" focusable="false">
        <defs>
          <filter id="mercury-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="mercury-stage" aria-hidden="true">
        {blobs.map((blob, index) => (
          <div
            className="mercury-blob"
            key={index}
            ref={(element) => { blobRefs.current[index] = element }}
            style={{
              width: blob.size,
              height: blob.size,
              left: `${blob.left}%`,
              top: `${blob.top}%`,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="mercury-topline" aria-hidden="true"><span>RA // 001</span><span>NAIROBI FLOOD MODEL</span></div>

      <section className="mercury-auth" aria-labelledby="mercury-title">
        <header className="mercury-header">
          <span className="mercury-overline"><span className="mercury-status-dot" /> SYSTEM NODE: RISK ATLAS</span>
          <h1 id="mercury-title">RISK<br />ATLAS<span className="mercury-period">.</span></h1>
          <p>Enter the workspace. Explore Nairobi flood risk.</p>
        </header>

        <form onSubmit={submit}>
          <div className="mercury-field">
            <label htmlFor="mercury-identity">User identity</label>
            <input id="mercury-identity" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
            <span className="mercury-input-glow" aria-hidden="true" />
          </div>

          <div className="mercury-field">
            <label htmlFor="mercury-key">Sequence key</label>
            <div className="mercury-password-wrap">
              <input id="mercury-key" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" required />
              <button className="mercury-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <span className="mercury-input-glow" aria-hidden="true" />
          </div>

          <div className="mercury-submit-wrap">
            <span className="mercury-drop" aria-hidden="true" />
            <button className="mercury-submit" type="submit">OPEN FLOOD MODEL <span aria-hidden="true">↗</span></button>
          </div>
        </form>

        <nav className="mercury-footer-nav" aria-label="Login options">
          <a href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}>← BACK TO SITE</a>
          <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('/dashboard') }}>EXPLORE DEMO ↗</a>
        </nav>
        <p className="mercury-access-note">Prototype access opens sample data. Account authentication is not connected yet.</p>
      </section>

      <div className="mercury-bottomline" aria-hidden="true"><span>KENYA RE HACKATHON</span><span>© 2026 RISK ATLAS</span></div>
    </main>
  )
}
