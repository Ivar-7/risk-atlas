import { useState, type ReactNode } from 'react'
import {
  Activity, ArrowLeft, ChevronDown, ChevronRight, Info, Layers3,
  LayoutDashboard, MapPinned, Search, ShieldCheck, Waves, X,
} from 'lucide-react'
import type { RunResult } from '../../features/model/types'

export const dashboardSections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'loss-curve', label: 'Loss curve', icon: Activity },
  { id: 'hazard-proxy', label: 'Hazard proxy', icon: Waves },
  { id: 'exposure-map', label: 'Exposure map', icon: MapPinned },
  { id: 'construction', label: 'Construction', icon: Layers3 },
  { id: 'assumptions', label: 'Assumptions', icon: Info },
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
    onClick={() => onNavigate(id)}
    aria-current={activeId === id ? 'location' : undefined}
    className={`group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] tracking-wide transition-colors ${activeId === id ? 'bg-white/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
  >
    <Icon size={16} strokeWidth={1.5} className="shrink-0" />
    <span className="min-w-0 flex-1 truncate">{item.label}</span>
    {badge !== undefined && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{badge}</span>}
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
      className="mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/65 hover:bg-white/5 hover:text-foreground"
    >
      {title}<ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && <div className="ml-2 space-y-0.5 border-l border-border/70 pl-2">{children}</div>}
  </div>
}

export function DashboardSidebar({ activeId, run, onNavigate, onSearch, onClose }: Props) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const navigate = (id: DashboardSectionId) => { onNavigate(id); onClose() }

  return <div className="flex h-full w-[260px] flex-col border-r border-border/60 bg-card/70 p-3 font-sans">
    <div className="relative mb-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setSwitcherOpen((value) => !value)} aria-expanded={switcherOpen} aria-label="Switch workspace" className="group flex min-w-0 flex-1 items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">RA</span>
            <span className="flex min-w-0 flex-col"><span className="truncate text-[13px] font-medium leading-none text-foreground">Risk Atlas</span><span className="mt-1 text-[11px] leading-none text-muted-foreground">Nairobi flood model</span></span>
          </span>
          <ChevronDown size={16} className="shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
        </button>
        <button type="button" onClick={onClose} aria-label="Close sidebar" className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground lg:hidden"><X size={17} /></button>
      </div>
      {switcherOpen && <div className="absolute inset-x-0 top-[54px] z-50 rounded-lg border border-border bg-card p-1 shadow-xl">
        <a href="#overview" onClick={() => { setSwitcherOpen(false); navigate('overview') }} className="block rounded-md bg-primary/10 px-3 py-2 text-[13px] text-primary">Dashboard overview</a>
        <a href="/app/" className="mt-0.5 block rounded-md px-3 py-2 text-[13px] text-foreground/80 hover:bg-white/5">Model workspace</a>
      </div>}
    </div>

    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" aria-label="Dashboard navigation">
      <div className="space-y-0.5">
        <button type="button" onClick={() => { onSearch(); onClose() }} className="group flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] tracking-wide text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"><Search size={16} strokeWidth={1.5} /> <span className="flex-1">Search</span><kbd className="hidden rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground/60 group-hover:inline-flex">⌘K</kbd></button>
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
        <NavLink id="assumptions" activeId={activeId} onNavigate={navigate} />
        <a href="/app/" className="flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] tracking-wide text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"><ShieldCheck size={16} strokeWidth={1.5} /> Run model</a>
      </NavGroup>
    </nav>

    <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
      <div className="rounded-lg border border-primary/15 bg-primary/5 p-3"><p className="flex items-center gap-2 text-xs font-medium text-primary"><ShieldCheck size={15} /> Current model run</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{run ? `${run.metrics.locations} locations · ${run.metrics.synthetic_locations} declared synthetic` : 'Waiting for model API'}</p></div>
      <a href="/" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-white/5 hover:text-foreground"><ArrowLeft size={16} strokeWidth={1.5} /> Back to site</a>
    </div>
  </div>
}
