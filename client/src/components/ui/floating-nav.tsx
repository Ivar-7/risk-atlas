import { useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { dashboardSections, type DashboardSectionId } from './dashboard-sidebar'

const mobileSectionIds = ['workspace', 'overview', 'loss-curve', 'exposure-map'] as const satisfies readonly DashboardSectionId[]
const moreSectionIds = ['portfolio', 'hazard-proxy', 'construction', 'ai-evidence', 'assumptions'] as const satisfies readonly DashboardSectionId[]

type FloatingNavProps = {
  activeId: DashboardSectionId
  onNavigate: (id: DashboardSectionId) => void
}

export default function FloatingNav({ activeId, onNavigate }: FloatingNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = !mobileSectionIds.some((id) => id === activeId)
  const navigate = (id: DashboardSectionId) => {
    setMoreOpen(false)
    onNavigate(id)
  }

  return <nav aria-label="Mobile dashboard navigation" className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-lg lg:hidden">
    <AnimatePresence>
      {moreOpen && <motion.div
        id="mobile-more-menu"
        role="menu"
        aria-label="More dashboard sections"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-dashboard"
      >
        {moreSectionIds.map((id) => {
          const section = dashboardSections.find((item) => item.id === id)!
          const Icon = section.icon
          return <button
            key={id}
            type="button"
            role="menuitem"
            onClick={() => navigate(id)}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
          ><Icon size={17} strokeWidth={1.7} />{section.label}</button>
        })}
      </motion.div>}
    </AnimatePresence>
    <div className="grid grid-cols-5 rounded-xl border border-border bg-surface/95 p-1 shadow-dashboard backdrop-blur">
      {mobileSectionIds.map((id) => {
        const section = dashboardSections.find((item) => item.id === id)!
        const Icon = section.icon
        const isActive = activeId === id

        return <button
          key={section.id}
          type="button"
          onClick={() => navigate(section.id)}
          aria-label={section.label}
          aria-current={isActive ? 'page' : undefined}
          className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:text-[11px] ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}
        >
          {isActive && <motion.span layoutId="mobile-dashboard-nav-indicator" transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="pointer-events-none absolute inset-0 rounded-lg bg-danger-tint" />}
          <Icon size={19} strokeWidth={1.7} className="relative z-10 shrink-0" />
          <span className="relative z-10 hidden truncate sm:block">{section.label}</span>
        </button>
      })}
      <button
        type="button"
        onClick={() => setMoreOpen((open) => !open)}
        aria-label="More dashboard sections"
        aria-expanded={moreOpen}
        aria-controls="mobile-more-menu"
        className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:text-[11px] ${moreActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}
      >
        {moreActive && <motion.span layoutId="mobile-dashboard-nav-indicator" transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="pointer-events-none absolute inset-0 rounded-lg bg-danger-tint" />}
        <Ellipsis size={19} strokeWidth={1.7} className="relative z-10 shrink-0" />
        <span className="relative z-10 hidden sm:block">More</span>
      </button>
    </div>
  </nav>
}
