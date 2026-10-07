import { CircleCheck, CircleAlert, ArrowRight } from 'lucide-react'
import { validation } from '../../content/landing'
import Reveal from './Reveal'
import { SectionShell } from './primitives'

export function ValidationSection() {
  return (
    <SectionShell
      id={validation.id}
      eyebrow={validation.eyebrow}
      title={validation.title}
      lede={validation.lede}
      alt
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <article className="flex h-full flex-col rounded-2xl border border-[#a7f3d0]/20 bg-[#a7f3d0]/[0.05] p-6 sm:p-7">
            <div className="flex items-center gap-2.5">
              <CircleCheck size={18} strokeWidth={1.8} aria-hidden className="text-[#a7f3d0]" />
              <h3 className="text-base font-medium tracking-[-0.01em] text-white">{validation.catches.title}</h3>
            </div>
            <p className="mt-4 text-[13.5px] font-light leading-6 text-white/75">{validation.catches.body}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[#a7f3d0]/15 pt-5">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-white/75">Hotspots scored</dt>
                <dd className="mt-1 text-xl font-medium tabular-nums text-white/85">24</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-white/75">Flagged by the proxy</dt>
                <dd className="mt-1 text-xl font-medium tabular-nums text-white/85">12</dd>
              </div>
            </dl>
          </article>
        </Reveal>

        <Reveal delay={90}>
          <article className="flex h-full flex-col rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-6 sm:p-7">
            <div className="flex items-center gap-2.5">
              <CircleAlert size={18} strokeWidth={1.8} aria-hidden className="text-amber-200" />
              <h3 className="text-base font-medium tracking-[-0.01em] text-white">{validation.misses.title}</h3>
            </div>
            <p className="mt-4 text-[13.5px] font-light leading-6 text-white/75">{validation.misses.body}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-amber-300/15 pt-5">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-white/75">Hotspots missed</dt>
                <dd className="mt-1 text-xl font-medium tabular-nums text-white/85">12</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-white/75">Likely mechanism</dt>
                <dd className="mt-1 text-[13.5px] font-light leading-6 text-white/65">Drainage overload</dd>
              </div>
            </dl>
          </article>
        </Reveal>
      </div>

      <Reveal delay={140} className="mt-5">
        <p className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#141416] px-6 py-5 text-[13.5px] font-light leading-6 text-white/72">
          <ArrowRight size={16} strokeWidth={1.6} aria-hidden className="shrink-0 text-[#a7f3d0]" />
          <span>
            <strong className="font-medium text-white/80">Next improvement.</strong> {validation.note}
          </span>
        </p>
      </Reveal>
    </SectionShell>
  )
}