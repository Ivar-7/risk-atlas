import { Brain, ClipboardList, MessageSquare, ArrowRight, Waves } from 'lucide-react'
import { aiLayer } from '../../content/landing'
import Reveal from './Reveal'
import { SectionShell } from './primitives'

const featureIcons = {
  drainage: Waves,
  ingest: ClipboardList,
  briefing: MessageSquare,
} as const

export function AiLayerSection() {
  return (
    <SectionShell
      id={aiLayer.id}
      eyebrow={aiLayer.eyebrow}
      title={aiLayer.title}
      lede={aiLayer.lede}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <div className="space-y-4">
          {aiLayer.features.map((feature, index) => {
            const Icon = featureIcons[feature.icon as keyof typeof featureIcons]
            return (
              <Reveal key={feature.title} delay={index * 80}>
                <article className="rounded-2xl border border-white/10 bg-[#141416] p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#a7f3d0]/25 bg-[#a7f3d0]/10 text-[#a7f3d0]">
                    <Icon size={17} strokeWidth={1.7} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-base font-medium tracking-[-0.01em] text-white">{feature.title}</h3>
                  <p className="mt-2 text-[13.5px] font-light leading-6 text-white/68">{feature.body}</p>
                </article>
              </Reveal>
            )
          })}

          <Reveal delay={160}>
            <p className="flex gap-3 rounded-2xl border border-[#a7f3d0]/20 bg-[#a7f3d0]/[0.06] p-5 text-[13.5px] font-light leading-6 text-white/65">
              <Brain size={17} strokeWidth={1.7} aria-hidden className="mt-0.5 shrink-0 text-[#a7f3d0]" />
              <span>{aiLayer.emphasis}</span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6 sm:p-7">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/72">
              Mock exchange · static text, no API call
            </p>

            <div className="mt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/75">
                {aiLayer.mock.inputLabel}
              </p>
              <p className="mt-2.5 rounded-xl border border-white/10 bg-[#0c0c0e] p-4 text-[13.5px] font-light leading-6 text-white/70">
                &ldquo;{aiLayer.mock.input}&rdquo;
              </p>
            </div>

            <div className="mt-5 flex justify-center text-white/20" aria-hidden>
              <ArrowRight size={16} strokeWidth={1.6} className="rotate-90" />
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/75">
                {aiLayer.mock.outputLabel}
              </p>
              <ul className="mt-2.5 space-y-2">
                {aiLayer.mock.outputRows.map((row) => (
                  <li
                    key={row.label}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-[#0c0c0e] px-4 py-3"
                  >
                    <span>
                      <span className="block text-[13.5px] font-medium text-white/80">{row.label}</span>
                      <span className="mt-0.5 block text-[12px] text-white/62">{row.meta}</span>
                    </span>
                    <span className="text-[13px] tabular-nums text-white/72">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-5 text-[11.5px] leading-5 text-white/72">{aiLayer.mock.note}</p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}
