import type { ReactNode } from 'react'

export function Panel({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return <section id={id} className={`min-w-0 scroll-mt-20 rounded-xl border border-border/70 bg-card shadow-sm ${className}`}>{children}</section>
}

export function PanelHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/75">{eyebrow}</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
