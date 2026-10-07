import type { ReactNode } from 'react'

export function Panel({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return <section id={id} className={`min-w-0 rounded-2xl border border-white/10 bg-[#141b1d] ${className}`}>{children}</section>
}

export function PanelHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/65">{eyebrow}</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="mt-1.5 text-xs leading-5 text-white/45">{description}</p>}
      </div>
      {action}
    </div>
  )
}
