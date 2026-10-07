import { ChevronRight, Hexagon } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { navigate } from '../App'
import Reveal from '../components/Reveal'
import ScrollVideo from '../components/ScrollVideo'

const services = ['/ FLOOD HAZARD', '/ INSURED EXPOSURE', '/ LOSS ESTIMATION']
const capabilities = [
  { number: '01', title: 'Flood footprint', body: 'Compare illustrative flood scenarios across Nairobi.' },
  { number: '02', title: 'Insured exposure', body: 'See where portfolio assets meet the modelled flood extent.' },
  { number: '03', title: 'Financial impact', body: 'Connect damage to annual loss and probable maximum loss.' },
]

function GlassBadge({ children }: { children: ReactNode }) {
  return <span className="inline-block border-l-2 border-emerald-200 bg-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white backdrop-blur-md">{children}</span>
}

function FloodThumbnail() {
  return (
    <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-emerald-100/20 bg-[#0c1b20]" aria-hidden="true">
      <svg viewBox="0 0 80 96" className="h-full w-full">
        <path d="M10 20 57 12 71 31 63 78 34 88 7 66Z" fill="#183039" stroke="#a5e3e5" strokeOpacity=".5" strokeWidth="1" />
        <path d="M4 27 76 14M4 46 76 33M4 65 76 52M6 84 73 69M22 6 30 92M43 5 50 91M63 5 67 86" stroke="#a5e3e5" strokeOpacity=".14" strokeWidth=".8" />
        <path d="M6 72C22 70 18 47 35 48s12-25 39-30" fill="none" stroke="#55b9d2" strokeOpacity=".8" strokeWidth="5" />
        <path d="M6 72C22 70 18 47 35 48s12-25 39-30" fill="none" stroke="#a5e3e5" strokeOpacity=".65" strokeWidth="1" />
        <circle cx="31" cy="51" r="9" fill="#55b9d2" opacity=".3" /><circle cx="31" cy="51" r="2" fill="#b7edf1" />
        <circle cx="51" cy="36" r="7" fill="#55b9d2" opacity=".3" /><circle cx="51" cy="36" r="2" fill="#b7edf1" />
      </svg>
    </div>
  )
}

export default function LandingPage() {
  useEffect(() => {
    const target = window.location.hash.slice(1)
    if (!target) return
    const frame = window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView())
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] font-sans text-white">
      <ScrollVideo />
      <div className="relative z-10">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-white/10 px-5 backdrop-blur-md sm:px-8 md:px-12">
          <nav className="flex h-[72px] items-center justify-between gap-5" aria-label="Main navigation">
            <Reveal>
              <a href="/" className="flex items-center gap-2.5 text-lg font-medium tracking-tight text-white sm:text-xl" aria-label="Risk Atlas home">
                <Hexagon size={24} strokeWidth={1.5} className="text-emerald-200" />
                <span>risk atlas</span>
              </a>
            </Reveal>
            <div className="hidden items-center gap-8 md:flex lg:gap-10">
              {[
                { label: 'Overview', href: '#overview' },
                { label: 'The model', href: '#model' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Sign in', href: '/login' },
              ].map((link, index) => (
                <Reveal key={link.label} delay={100 + index * 100}>
                  <a href={link.href} onClick={link.href.startsWith('/') ? (event) => { event.preventDefault(); navigate(link.href) } : undefined} className="text-sm text-white/85 transition-colors duration-300 hover:text-white">
                    {link.label}
                  </a>
                </Reveal>
              ))}
            </div>
            <Reveal delay={500}>
              <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('/dashboard') }} className="inline-flex rounded-md border border-white/20 bg-white/15 px-4 py-2 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/25 sm:px-5 sm:text-sm">
                Explore Dashboard
              </a>
            </Reveal>
          </nav>
        </header>

        <main>
          <section id="overview" className="flex min-h-screen flex-col justify-between gap-16 px-5 pb-12 pt-24 supports-[height:100svh]:min-h-[100svh] sm:px-8 sm:pt-28 md:px-12 md:pb-16" aria-labelledby="hero-title">
            <div className="flex flex-col justify-between gap-8 sm:flex-row">
              <div className="flex flex-col gap-2">
                {services.map((service, index) => (
                  <Reveal key={service} delay={150 + index * 120}>
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-white/90 drop-shadow-md">{service}</p>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={300} className="max-w-xs sm:text-right">
                <p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">Risk Atlas helps Kenya Re see how Nairobi flood events affect insured property and potential loss.</p>
              </Reveal>
            </div>

            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <Reveal delay={150} className="mb-5"><GlassBadge>Kenya Re · Nairobi Flood Model</GlassBadge></Reveal>
                <Reveal delay={280}>
                  <h1 id="hero-title" className="text-5xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">Map the flood.<br />Measure the loss.</h1>
                </Reveal>
              </div>
              <Reveal delay={420}>
                <div className="flex w-fit items-center gap-4 rounded-xl bg-white/15 p-3 backdrop-blur-md">
                  <FloodThumbnail />
                  <div className="flex flex-col gap-1.5 pr-2">
                    <span className="text-sm font-medium text-white">Nairobi flood map</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">Sample scenario</span>
                    <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('/dashboard') }} className="mt-1.5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85">
                      Explore risk map <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <div className="h-[80vh]" aria-hidden="true" />

          <section id="model" className="flex min-h-screen flex-col justify-between gap-16 px-5 pb-12 pt-24 supports-[height:100svh]:min-h-[100svh] sm:px-8 sm:pt-28 md:px-12 md:pb-16" aria-labelledby="capability-title">
            <div className="flex flex-col justify-between gap-8 sm:flex-row">
              <Reveal delay={120}><GlassBadge>From Flood To Financial Loss</GlassBadge></Reveal>
              <Reveal delay={220} className="max-w-sm sm:text-right">
                <p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">Connect flood hazard, exposure, vulnerability, and financial terms in one clear view.</p>
              </Reveal>
            </div>

            <div className="flex flex-1 flex-col justify-end gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
              <div className="max-w-xl">
                <Reveal delay={180}>
                  <h2 id="capability-title" className="text-5xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">See the water.<br />See the impact.</h2>
                </Reveal>
                <Reveal delay={320} className="mt-6 max-w-md">
                  <p className="text-sm text-white/80 drop-shadow-md sm:text-base">Explore illustrative Nairobi flood scenarios against a sample insured portfolio, then trace the impact through average annual loss and probable maximum loss.</p>
                </Reveal>
                <Reveal delay={420} className="mt-8 flex flex-wrap gap-3">
                  <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('/dashboard') }} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85 sm:text-sm">Explore flood dashboard <ChevronRight size={14} /></a>
                  <a href="/login" onClick={(event) => { event.preventDefault(); navigate('/login') }} className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm">Sign in</a>
                </Reveal>
              </div>

              <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 px-5 backdrop-blur-md sm:px-6">
                {capabilities.map((item, index) => (
                  <Reveal key={item.number} delay={300 + index * 110}>
                    <div className={`group flex gap-5 py-5 ${index < capabilities.length - 1 ? 'border-b border-white/15' : ''}`}>
                      <span className="pt-1 font-mono text-[11px] tracking-[0.15em] text-white/55">{item.number}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-medium text-white sm:text-lg">{item.title}</h3>
                          <ChevronRight size={16} className="text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-white/70">{item.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
