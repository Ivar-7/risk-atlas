import type { ComponentType, ReactNode } from 'react'

export type Tone = 'mint' | 'amber' | 'slate'

/**
 * The page keeps the hero's palette: black grounds, #181818 panels,
 * rgba(255,255,255,.09) hairlines, mint #a7f3d0 accent, #a78bfa focus ring.
 */
export const toneClasses: Record<Tone, { chip: string; dot: string }> = {
  mint: { chip: 'border-[#a7f3d0]/30 bg-[#a7f3d0]/10 text-[#a7f3d0]', dot: 'bg-[#a7f3d0]' },
  amber: { chip: 'border-amber-300/30 bg-amber-300/10 text-amber-200', dot: 'bg-amber-300' },
  slate: { chip: 'border-white/15 bg-white/5 text-white/70', dot: 'bg-white/45' },
}

export function Pill({
  tone = 'mint',
  icon: Icon,
  children,
}: {
  tone?: Tone
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean }>
  children: ReactNode
}) {
  const { chip } = toneClasses[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none ${chip}`}>
      {Icon ? <Icon size={12} strokeWidth={2} aria-hidden /> : null}
      {children}
    </span>
  )
}

/** Required near any chart or stat, per the honesty rules. */
export function SyntheticBadge() {
  return <Pill tone="slate">Synthetic data</Pill>
}

export function IllustrativeTag() {
  return <Pill tone="amber">Illustrative example</Pill>
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 10" fill="none" aria-hidden className={`block h-2.5 w-3 shrink-0 ${className}`}>
      <path
        d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PrimaryLink({
  href,
  children,
  external = false,
  className = '',
}: {
  href: string
  children: ReactNode
  external?: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#fdfdfd] px-6 text-sm font-medium tracking-[-0.2px] text-[#050505] transition-colors hover:bg-white ${className}`}
    >
      {children}
      <Arrow />
    </a>
  )
}

export function GhostLink({
  href,
  children,
  external = false,
  className = '',
}: {
  href: string
  children: ReactNode
  external?: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#181818]/80 px-6 text-sm font-medium tracking-[-0.2px] text-[#d9d9d9] backdrop-blur-[2px] transition-colors hover:border-white/15 hover:bg-[#232323] hover:text-white ${className}`}
    >
      {children}
      <Arrow />
    </a>
  )
}

export function SectionShell({
  id,
  eyebrow,
  title,
  lede,
  children,
  alt = false,
  className = '',
  headingExtra,
}: {
  id: string
  eyebrow: string
  title: string
  lede?: string
  children: ReactNode
  alt?: boolean
  className?: string
  headingExtra?: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-16 border-t border-white/[0.07] ${alt ? 'bg-[#08090a]' : 'bg-[#000000]'} ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#b8f5da]">{eyebrow}</p>
          <h2
            id={`${id}-heading`}
            className="mt-4 text-[clamp(1.75rem,4.2vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white"
          >
            {title}
          </h2>
          {lede ? <p className="mt-4 text-[15px] font-light leading-7 text-white/72">{lede}</p> : null}
          {headingExtra}
        </div>
        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </section>
  )
}