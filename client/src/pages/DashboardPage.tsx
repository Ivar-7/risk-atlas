import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, BarChart3, Info, Layers3, LayoutDashboard, MapPinned, Menu, ShieldCheck, Waves, X } from 'lucide-react'
import { navigate } from '../App'
import Dashboard from '../components/ui/dashboard-4'

const sections = [
  { label: 'Overview', href: '#overview', icon: LayoutDashboard },
  { label: 'Loss curve', href: '#loss-curve', icon: Activity },
  { label: 'Hazard proxy', href: '#hazard-proxy', icon: Waves },
  { label: 'Exposure map', href: '#exposure-map', icon: MapPinned },
  { label: 'Construction', href: '#construction', icon: Layers3 },
  { label: 'Assumptions', href: '#assumptions', icon: Info },
]

function Brand() {
  return <span className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white"><svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2.5 35 11v18L20 37.5 5 29V11Z" stroke="#a7f3d0" strokeWidth="2.2" strokeLinejoin="round" /><path d="M9 24c4.8-3.8 8.7-3.8 13.2 0 3.1 2.6 5.8 2.6 8.8.5M9 18.1c4.8-3.8 8.7-3.8 13.2 0 3.1 2.6 5.8 2.6 8.8.5" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" /><circle cx="28.5" cy="11.8" r="1.4" fill="#a7f3d0" /></svg> risk atlas</span>
}

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('#overview')

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const frame = window.requestAnimationFrame(() => {
      const section = document.getElementById(decodeURIComponent(hash.slice(1)))
      section?.scrollIntoView()
      if (section) setActiveSection(hash)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="min-h-screen bg-[#0c1013] font-sans text-white lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-0 z-40 flex-col border-r border-white/10 bg-[#10171a] px-5 pb-6 pt-7 lg:sticky lg:top-0 lg:flex lg:h-screen`}>
        <div className="flex items-center justify-between">
          <Brand />
          <button type="button" className="rounded-md p-1 text-white/60 hover:text-white lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <p className="mt-12 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Nairobi model</p>
        <nav className="mt-3 space-y-1" aria-label="Dashboard navigation">
          {sections.map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              onClick={() => { setActiveSection(href); setMenuOpen(false) }}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${activeSection === href ? 'bg-emerald-200/10 text-emerald-100' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} strokeWidth={1.7} /> {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-emerald-200/15 bg-emerald-200/5.5 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-100"><ShieldCheck size={17} /> Prototype workspace</div>
          <p className="mt-2 text-xs leading-5 text-white/45">600 synthetic buildings. Five susceptibility masks. No real client portfolio or measured flood depth.</p>
        </div>
        <button type="button" onClick={() => navigate('/')} className="mt-5 flex items-center gap-3 border-t border-white/10 px-2 pt-5 text-left text-sm text-white/50 hover:text-white"><ArrowLeft size={16} /> Back to site</button>
      </aside>

      <div className="min-w-0">
        <header className="flex h-18 items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-md p-1 text-white/70 hover:text-white lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            <span className="hidden text-sm text-white/40 sm:inline">Risk Atlas</span><span className="hidden text-white/20 sm:inline">/</span><span className="text-sm font-medium">Nairobi flood model</span>
          </div>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs text-white/45 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Illustrative run</span><span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#26332e] text-xs font-semibold text-emerald-100">RA</span></div>
        </header>

        <main id="overview" className="mx-auto max-w-[1600px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200/70">Kenya Re hackathon · Team A</p>
              <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Nairobi flood risk overview</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Explore how a flood susceptibility proxy, synthetic exposure, and assumed vulnerability combine into illustrative portfolio loss.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs text-white/60"><BarChart3 size={15} /> Five assumed scenarios</span>
          </div>

          <div className="my-7 flex items-start gap-3 rounded-xl border border-amber-200/15 bg-amber-200/4.5 px-4 py-3 text-xs leading-5 text-amber-50/70">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-200/75" />
            <p><strong className="font-medium text-amber-50">Interpretation matters.</strong> The buildings are synthetic, the hazard is a relative proxy, and return periods and damage factors are provisional assumptions. These estimates are not for underwriting.</p>
          </div>

          <Dashboard />
          <p className="mt-6 text-[11px] leading-5 text-white/30">Source: Nairobi starter-kit exposure with pre-attached hazard scores. The dashboard calculates results in the browser from a generated snapshot of that file.</p>
        </main>
      </div>
    </div>
  )
}
