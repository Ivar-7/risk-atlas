import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Info, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, UserRound, X } from 'lucide-react'
import Dashboard from '../components/ui/dashboard-4'
import { validateDashboardRun } from '../components/ui/dashboard-4-utils/model'
import { DashboardSidebar, dashboardSections, type DashboardSectionId } from '../components/ui/dashboard-sidebar'
import DashboardLoader from '../components/ui/v-skeleton-8'
import { fetchLatest } from '../features/model/api'
import { money } from '../features/model/format'
import type { RunResult } from '../features/model/types'

const underwriterName = 'Lennox'
const sectionDescriptions: Record<DashboardSectionId, string> = {
  overview: 'A concise view of the latest backend model run and portfolio loss.',
  'loss-curve': 'Compare gross loss across the model’s assumed return periods.',
  'hazard-proxy': 'See how many portfolio locations have modelled loss at each proxy tier.',
  'exposure-map': 'Explore modelled locations and named hotspots on OpenStreetMap.',
  construction: 'Compare selected-scenario loss across building classes.',
  'ai-evidence': 'Inspect the contribution of reviewed model extraction and the deterministic drainage rule.',
  assumptions: 'Review the inputs, provenance, and assumptions behind this run.',
}

function timeGreeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Nairobi' }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('overview')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [run, setRun] = useState<RunResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [greeting, setGreeting] = useState(timeGreeting)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const latest = await fetchLatest()
      validateDashboardRun(latest)
      setRun(latest)
    } catch (reason) {
      setRun(null)
      setError(reason instanceof Error ? reason.message : 'Could not load model run')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    const syncSection = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      setActiveSection(dashboardSections.some((section) => section.id === id) ? id as DashboardSectionId : 'overview')
    }
    syncSection()
    window.addEventListener('popstate', syncSection)
    window.addEventListener('hashchange', syncSection)
    return () => { window.removeEventListener('popstate', syncSection); window.removeEventListener('hashchange', syncSection) }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setGreeting(timeGreeting()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const navigateSection = (id: DashboardSectionId) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
    setActiveSection(id)
    setMobileOpen(false)
    setSearchOpen(false)
    setSearchTerm('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const searchResults = dashboardSections.filter((section) => section.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  const activeTitle = dashboardSections.find((section) => section.id === activeSection)?.label ?? 'Overview'

  if (loading && !run) return <DashboardLoader />

  return <div className={`min-h-screen bg-background font-sans text-foreground ${sidebarOpen ? 'lg:grid lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
    {sidebarOpen && <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen"><DashboardSidebar activeId={activeSection} run={run} onNavigate={navigateSection} onSearch={() => setSearchOpen(true)} onClose={() => setMobileOpen(false)} /></aside>}
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-black/65" onClick={() => setMobileOpen(false)} aria-label="Close navigation" /><aside className="relative h-full w-[260px] shadow-2xl"><DashboardSidebar activeId={activeSection} run={run} onNavigate={navigateSection} onSearch={() => setSearchOpen(true)} onClose={() => setMobileOpen(false)} /></aside></div>}

    <div className="min-w-0 bg-white/[0.015]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-card px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open sidebar" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground lg:hidden"><PanelLeftOpen size={18} strokeWidth={1.5} /></button>
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground lg:inline-flex">{sidebarOpen ? <PanelLeftClose size={18} strokeWidth={1.5} /> : <PanelLeftOpen size={18} strokeWidth={1.5} />}</button>
          <div className="flex min-w-0 items-center gap-2 text-sm"><span className="hidden truncate text-muted-foreground sm:inline">Risk Atlas</span><span className="hidden text-muted-foreground/50 sm:inline">/</span><span className="truncate font-medium">{activeTitle}</span></div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={() => setSearchOpen(true)} className="flex h-8 items-center gap-2 rounded-md bg-white/5 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground sm:w-52" aria-label="Search dashboard sections"><Search size={15} /><span className="hidden flex-1 text-left sm:inline">Search sections</span><kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">⌘K</kbd></button>
          <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className={`h-1.5 w-1.5 rounded-full ${run ? 'bg-primary' : 'bg-amber-300'}`} />{run ? 'API connected' : loading ? 'Connecting…' : 'API unavailable'}</span>
          <div className="flex items-center gap-2.5" aria-label={`${greeting}, ${underwriterName}, Underwriter`}>
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-foreground">Hi, {underwriterName}</p><p className="text-[11px] text-muted-foreground">{greeting} · Underwriter</p></div>
            <span className="flex size-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"><UserRound size={18} strokeWidth={1.7} aria-hidden="true" /></span>
          </div>
        </div>
      </header>

      <main id="overview" className="mx-auto max-w-[1600px] scroll-mt-20 px-5 pb-12 pt-7 sm:px-7 xl:px-9">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary/75">Kenya Re hackathon · Team A</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{activeSection === 'overview' ? 'Nairobi flood risk overview' : activeTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{sectionDescriptions[activeSection]}</p></div>
          {run && <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground"><BarChart3 size={15} />{run.scenarios.length} assumed scenarios</span>}
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200/15 bg-amber-200/[0.04] px-4 py-3 text-xs leading-5 text-amber-50/75"><Info size={16} className="mt-0.5 shrink-0 text-amber-200/75" /><p><strong className="font-medium text-amber-50">Interpretation matters.</strong> {run ? run.disclaimer : 'Exposure provenance and model assumptions will load from the API.'} These estimates are not for underwriting.</p></div>

        {run && <section className="mb-5 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6" aria-label="Current model run">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/75">Backend model engine</p><h2 className="mt-2 text-lg font-semibold">Current run</h2><p className="mt-3 text-sm text-muted-foreground">AAL <strong className="text-foreground">{money(run.metrics.aal_kes)}</strong> · {run.metrics.locations} locations · Run {run.run_id.slice(0, 8)} · {new Date(run.created_at).toLocaleString('en-KE')}</p></div>
          <div className="flex items-center gap-3"><button type="button" onClick={() => void reload()} disabled={loading} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 disabled:opacity-50"><RefreshCw size={15} />Refresh</button><a href="/app/" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Run model</a></div>
        </section>}
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-6 text-sm text-rose-100"><span>Model API unavailable: {error}. Start the backend service and retry.</span><button type="button" onClick={() => void reload()} className="flex items-center gap-2 underline"><RefreshCw size={15} />Retry</button></div>}
        {run && <section aria-label={`${activeTitle} dashboard section`}><Dashboard run={run} activeSection={activeSection} /></section>}
        {run && <p className="mt-6 text-[11px] leading-5 text-muted-foreground/70">Source: current model API run over the configured exposure CSV and hazard proxy. {run.metrics.synthetic_locations} of {run.metrics.locations} locations are declared synthetic. OpenStreetMap provides the basemap.</p>}
      </main>
    </div>

    {searchOpen && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-background/75 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-label="Search dashboard sections" className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4"><Search size={18} className="text-muted-foreground" /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search dashboard sections…" className="min-w-0 flex-1 bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60" /><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
        <div className="max-h-[50vh] overflow-y-auto p-2">{searchResults.length ? searchResults.map((section) => { const Icon = section.icon; return <a key={section.id} href={`#${section.id}`} onClick={(event) => { event.preventDefault(); navigateSection(section.id) }} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground/80 hover:bg-white/5 hover:text-foreground"><Icon size={17} strokeWidth={1.5} />{section.label}</a> }) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching dashboard section</p>}</div>
      </section>
    </div>}
  </div>
}
