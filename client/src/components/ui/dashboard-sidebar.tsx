import { useState, type ReactNode } from 'react'
import {
  Activity, ArrowLeft, BrainCircuit, ChevronDown, ChevronRight, Info, Layers3,
  LayoutDashboard, MapPinned, Search, ShieldCheck, Waves, X,
} from 'lucide-react'
import type { RunResult } from '../../features/model/types'

export const dashboardSections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'loss-curve', label: 'Loss curve', icon: Activity },
  { id: 'hazard-proxy', label: 'Hazard proxy', icon: Waves },
  { id: 'exposure-map', label: 'Exposure map', icon: MapPinned },
  { id: 'construction', label: 'Construction', icon: Layers3 },
  { id: 'ai-evidence', label: 'AI evidence', icon: BrainCircuit },
  { id: 'assumptions', label: 'Assumptions', icon: Info },
  { id: 'workspace', label: 'Model workspace', icon: ShieldCheck },
] as const

export type DashboardSectionId = (typeof dashboardSections)[number]['id']

type Props = {
  activeId: DashboardSectionId
  run: RunResult | null
  onNavigate: (id: DashboardSectionId) => void
  onSearch: () => void
  onClose: () => void
}

function NavLink({ id, activeId, onNavigate, children, badge }: {
  id: DashboardSectionId
  activeId: DashboardSectionId
  onNavigate: (id: DashboardSectionId) => void
  children?: ReactNode
  badge?: number
}) {
  const item = dashboardSections.find((section) => section.id === id)!
  const Icon = item.icon
  return <a
    href={`#${id}`}
    onClick={(event) => { event.preventDefault(); onNavigate(id) }}
    aria-current={activeId === id ? 'page' : undefined}
    className={`group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${activeId === id ? 'bg-surface-alt font-semibold text-brand-navy' : 'text-text-muted hover:bg-surface-alt hover:text-text'}`}
  >
    <Icon size={16} strokeWidth={1.5} className={`shrink-0 ${activeId === id ? 'text-brand-crimson' : ''}`} />
    <span className="min-w-0 flex-1 truncate">{item.label}</span>
    {badge !== undefined && <span className="rounded-full bg-surface-alt px-1.5 py-0.5 text-[10px] font-medium text-text-muted">{badge}</span>}
    {children}
  </a>
}

function NavGroup({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return <div>
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      className="mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-semibold tracking-wide text-text-muted hover:bg-surface-alt hover:text-text"
    >
      {title}<ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && <div className="ml-2 space-y-0.5 border-l border-border/70 pl-2">{children}</div>}
  </div>
}

export function DashboardSidebar({ activeId, run, onNavigate, onSearch, onClose }: Props) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const navigate = (id: DashboardSectionId) => { onNavigate(id); onClose() }

  return <div className="flex h-full w-65 flex-col border-r border-border bg-surface p-3 font-sans">
    <div className="relative mb-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setSwitcherOpen((value) => !value)} aria-expanded={switcherOpen} aria-label="Switch workspace" className="group flex min-w-0 flex-1 items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-alt">
          <span className="flex min-w-0 items-center gap-3">
            <img src="/assets/logo-horizontal.svg" alt="Risk Atlas" className="h-8 w-auto max-w-full shrink-0 object-contain" />
          </span>
          <ChevronDown size={16} className="shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
        </button>
        <button type="button" onClick={onClose} aria-label="Close sidebar" className="rounded-md p-2 text-text-muted hover:bg-surface-alt hover:text-text lg:hidden"><X size={17} /></button>
      </div>
      {switcherOpen && <div className="absolute inset-x-0 top-13.5 z-50 rounded-lg border border-border bg-card p-1 shadow-xl">
        <a href="#overview" onClick={(event) => { event.preventDefault(); setSwitcherOpen(false); navigate('overview') }} className="block rounded-md bg-surface-alt px-3 py-2 text-sm font-semibold text-brand-navy">Dashboard overview</a>
        <a href="#workspace" onClick={(event) => { event.preventDefault(); setSwitcherOpen(false); navigate('workspace') }} className="mt-0.5 block rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-alt">Model workspace</a>
      </div>}
    </div>

    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" aria-label="Dashboard navigation">
      <div className="space-y-0.5">
        <button type="button" onClick={() => { onSearch(); onClose() }} className="group flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-text-muted transition-colors hover:bg-surface-alt hover:text-text"><Search size={16} strokeWidth={1.5} /> <span className="flex-1">Search</span><kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted group-hover:inline-flex">⌘K</kbd></button>
        <NavLink id="overview" activeId={activeId} onNavigate={navigate} />
      </div>
      <NavGroup title="Analysis">
        <NavLink id="loss-curve" activeId={activeId} onNavigate={navigate} badge={run?.scenarios.length} />
        <NavLink id="hazard-proxy" activeId={activeId} onNavigate={navigate} />
      </NavGroup>
      <NavGroup title="Portfolio">
        <NavLink id="exposure-map" activeId={activeId} onNavigate={navigate} badge={run?.metrics.locations} />
        <NavLink id="construction" activeId={activeId} onNavigate={navigate} />
      </NavGroup>
      <NavGroup title="Workspace">
        <NavLink id="ai-evidence" activeId={activeId} onNavigate={navigate} />
        <NavLink id="assumptions" activeId={activeId} onNavigate={navigate} />
        <NavLink id="workspace" activeId={activeId} onNavigate={navigate} />
      </NavGroup>
    </nav>

    <div className="mt-auto space-y-3 border-t border-border pt-4">
      <a href="/" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-muted hover:bg-surface-alt hover:text-text"><ArrowLeft size={16} strokeWidth={1.5} /> Back to site</a>
    </div>
  </div>
}
