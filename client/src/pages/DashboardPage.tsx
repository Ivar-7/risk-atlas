import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { UserButton, useAuth, useUser } from '@clerk/react'
import { BarChart3, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, X } from 'lucide-react'
import Dashboard from '../components/ui/dashboard-4'
import { PropertyUnderwritingSummary } from '../components/ui/property-underwriting-summary'
import { SubmittedExposureSummary } from '../components/ui/submitted-exposure-summary'
import FloatingNav from '../components/ui/floating-nav'
import { validateDashboardRun } from '../components/ui/dashboard-4-utils/model'
import { DashboardSidebar, dashboardSections, type DashboardSectionId } from '../components/ui/dashboard-sidebar'
import DashboardLoader from '../components/ui/v-skeleton-8'
import CatModelRunner from '../features/model/CatModelRunner'
const ModelWorkspace = lazy(() => import('./ModelWorkspace'))
import { fetchLatest, refreshSavedRun, setApiTokenGetter, type DocumentAssessment, type PropertyCalculation } from '../features/model/api'
import { money } from '../features/model/format'
import type { RunResult } from '../features/model/types'

const sectionDescriptions: Record<DashboardSectionId, string> = {
  overview: 'Loss and underwriting checks for the exposure in your latest calculation.',
  portfolio: 'Aggregate loss and concentration across the synthetic Nairobi portfolio.',
  'loss-curve': 'Inspect the complete ground-up and gross insured scenario table and curve.',
  'hazard-proxy': 'See how many portfolio locations have modelled loss at each proxy tier.',
  'exposure-map': 'Explore modelled locations and named hotspots on OpenStreetMap.',
  construction: 'Compare selected-scenario loss across building classes.',
  'ai-evidence': 'Inspect the contribution of reviewed model extraction and the deterministic drainage rule.',
  assumptions: 'Review the inputs, provenance, and assumptions behind this run.',
  workspace: 'Set portfolio terms, run the model, or review a separate property document.',
}

function timeGreeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Nairobi' }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('overview')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [run, setRun] = useState<RunResult | null>(null)
  const [assessment, setAssessment] = useState<DocumentAssessment | null>(null)
  const [propertyCalculation, setPropertyCalculation] = useState<PropertyCalculation | null>(null)
  const [summaryTarget, setSummaryTarget] = useState<'property' | 'submission'>('submission')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [greeting, setGreeting] = useState(timeGreeting)
  const { getToken } = useAuth()
  const { user } = useUser()
  const firstName = user?.firstName || user?.fullName?.split(/\s+/)[0] || user?.primaryEmailAddress?.emailAddress.split('@')[0] || 'there'

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let latest = await fetchLatest()
      try {
        validateDashboardRun(latest)
      } catch (reason) {
        if (!(reason instanceof Error) || !reason.message.includes('saved portfolio run')) throw reason
        latest = await refreshSavedRun(latest.run_id)
      }
      validateDashboardRun(latest)
      setRun(latest)
    } catch (reason) {
      setRun(null)
      setError(reason instanceof Error ? reason.message : 'Could not load model run')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setApiTokenGetter(getToken)
    return () => setApiTokenGetter(null)
  }, [getToken])

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
    setSearchOpen(false)
    setSearchTerm('')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const acceptRun = (result: RunResult) => {
    validateDashboardRun(result)
    setRun(result)
    setError('')
    if (result.interventions.free_text.rows_added > 0) {
      setSummaryTarget('submission')
      navigateSection('overview')
    } else navigateSection('portfolio')
  }
  const acceptPropertyCalculation = (calculation: PropertyCalculation) => {
    setPropertyCalculation(calculation)
    setSummaryTarget('property')
    navigateSection('overview')
  }
  const searchResults = dashboardSections.filter((section) => section.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  const activeTitle = dashboardSections.find((section) => section.id === activeSection)?.label ?? 'Overview'
  const needsRerun = error.includes('saved portfolio run') || error.includes('model API is missing')
  const showRunError = error && activeSection !== 'workspace' && !(activeSection === 'overview' && summaryTarget === 'property' && propertyCalculation)

  if (loading && !run) return <DashboardLoader />

  return <div className={`dashboard-theme min-h-screen bg-bg font-sans text-text ${sidebarOpen ? 'lg:grid lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
    {sidebarOpen && <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen"><DashboardSidebar activeId={activeSection} run={run} onNavigate={navigateSection} onSearch={() => setSearchOpen(true)} /></aside>}

    <div className="min-w-0 bg-bg">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} className="hidden rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-text lg:inline-flex">{sidebarOpen ? <PanelLeftClose size={18} strokeWidth={1.5} /> : <PanelLeftOpen size={18} strokeWidth={1.5} />}</button>
          <div className="flex min-w-0 items-center gap-2 text-sm"><span className="hidden truncate text-text-muted sm:inline">Risk Atlas</span><span className="hidden text-text-muted/50 sm:inline">/</span><span className="truncate font-medium">{activeTitle}</span></div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={() => setSearchOpen(true)} className="flex h-8 items-center gap-2 rounded-md bg-surface-alt px-2.5 text-xs text-text-muted transition-colors hover:bg-border hover:text-text sm:w-52" aria-label="Search dashboard sections"><Search size={15} /><span className="hidden flex-1 text-left sm:inline">Search sections</span><kbd className="hidden rounded border border-border bg-surface px-1 text-[10px] sm:inline">⌘K</kbd></button>
          <div className="flex items-center gap-2.5" aria-label={`${greeting}, ${user?.fullName ?? firstName}`}>
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-text">Hi, {firstName}</p><p className="text-[11px] text-text-muted">{greeting}</p></div>
            <UserButton />
          </div>
        </div>
      </header>

      <main id="overview" className="mx-auto max-w-[1600px] scroll-mt-20 px-5 pb-24 pt-7 sm:px-7 lg:pb-12 xl:px-9">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Risk Atlas workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{activeTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{sectionDescriptions[activeSection]}</p></div>
          {activeSection === 'overview' && (propertyCalculation || run?.interventions.free_text.rows_added) && <button type="button" onClick={() => navigateSection('workspace')} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover">Review model inputs</button>}
          {run && activeSection === 'portfolio' && <button type="button" onClick={() => navigateSection('workspace')} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover">Run another model</button>}
          {run && activeSection !== 'workspace' && activeSection !== 'overview' && activeSection !== 'portfolio' && <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-muted"><BarChart3 size={15} />{run.scenarios.length} assumed scenarios</span>}
        </div>

        {run && activeSection !== 'workspace' && activeSection !== 'overview' && activeSection !== 'portfolio' && <section className="mb-5 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border bg-surface p-5 shadow-dashboard sm:p-6" aria-label="Current model run">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Model run</p><h2 className="mt-2 text-lg font-semibold">Current run</h2><p className="mt-2 text-xs font-medium text-accent">Synthetic portfolio · proxy flood hazard · illustrative return periods</p><p className="mt-3 text-sm text-text-muted">Gross insured AAL <strong className="text-text">{money(run.metrics.aal_kes)}</strong> · {run.metrics.locations} locations</p></div>
          <div className="flex items-center gap-3"><button type="button" onClick={() => void reload()} disabled={loading} className="flex items-center gap-2 rounded-md border border-brand-navy/20 bg-surface px-3 py-2 text-sm text-text hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={15} />Refresh</button><button type="button" onClick={() => navigateSection('workspace')} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">Run model</button></div>
        </section>}
        {showRunError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-tint p-6 text-sm text-danger"><span>{error}</span><div className="flex gap-4">{needsRerun && <button type="button" onClick={() => navigateSection('workspace')} className="underline">Run updated model</button>}<button type="button" onClick={() => void reload()} className="flex items-center gap-2 underline"><RefreshCw size={15} />Retry</button></div></div>}
        {activeSection === 'workspace' && <div className="space-y-8"><CatModelRunner onRun={acceptRun} /><div className="border-t border-border pt-7"><Suspense fallback={<DashboardLoader />}><ModelWorkspace assessment={assessment} calculation={propertyCalculation} onReviewed={setAssessment} onCalculated={acceptPropertyCalculation} onInvalidated={() => setPropertyCalculation(null)} /></Suspense></div></div>}
        {activeSection === 'overview' && (summaryTarget === 'property'
          ? <PropertyUnderwritingSummary calculation={propertyCalculation} onNavigate={navigateSection} />
          : run?.interventions.free_text.rows_added
            ? <SubmittedExposureSummary run={run} onNavigate={navigateSection} />
            : <PropertyUnderwritingSummary calculation={null} onNavigate={navigateSection} />)}
        {run && activeSection !== 'workspace' && activeSection !== 'overview' && <section aria-label={`${activeTitle} dashboard section`}><Dashboard run={run} activeSection={activeSection} onNavigate={navigateSection} /></section>}
      </main>
    </div>

    {searchOpen && <div className="fixed inset-0 z-60 flex items-start justify-center bg-brand-navy/25 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-label="Search dashboard sections" className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-dashboard">
        <div className="flex items-center gap-3 border-b border-border px-4"><Search size={18} className="text-text-muted" /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search dashboard sections…" className="min-w-0 flex-1 bg-transparent py-4 text-sm text-text outline-none placeholder:text-text-muted" /><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="rounded-md p-1 text-text-muted hover:text-text"><X size={18} /></button></div>
        <div className="max-h-[50vh] overflow-y-auto p-2">{searchResults.length ? searchResults.map((section) => { const Icon = section.icon; return <a key={section.id} href={`#${section.id}`} onClick={(event) => { event.preventDefault(); navigateSection(section.id) }} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text hover:bg-surface-alt"><Icon size={17} strokeWidth={1.5} />{section.label}</a> }) : <p className="px-3 py-6 text-center text-sm text-text-muted">No matching dashboard section</p>}</div>
      </section>
    </div>}
    <FloatingNav activeId={activeSection} onNavigate={navigateSection} />
  </div>
}
