import { Building2, Ruler, Waves, Coins, ArrowRight, ArrowDown } from 'lucide-react'
import { howItWorks, problem } from '../../content/landing'
import Reveal from './Reveal'
import { SectionShell } from './primitives'

const stepIcons = {
  hazard: Waves,
  vulnerability: Ruler,
  exposure: Building2,
  financial: Coins,
} as const

const cardIcons = {
  buildingGrowth: Building2,
  riverCorridor: Waves,
  noData: Ruler,
} as const

export function ProblemSection() {
  return (
    <SectionShell
      id={problem.id}
      eyebrow={problem.eyebrow}
      title={problem.title}
      alt
      headingExtra={
        <p className="mt-6 max-w-2xl border-l-2 border-[#a7f3d0]/50 pl-4 text-[13px] leading-6 text-white/65">
          {problem.note}
        </p>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <Reveal className="space-y-5">
          {problem.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-[15px] font-light leading-7 text-white/75">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {problem.cards.map((card, index) => {
            const Icon = cardIcons[card.icon as keyof typeof cardIcons]
            return (
              <Reveal key={card.title} delay={index * 90}>
                <article className="h-full rounded-2xl border border-white/10 bg-[#141416] p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#a7f3d0]/25 bg-[#a7f3d0]/10 text-[#a7f3d0]">
                    <Icon size={17} strokeWidth={1.7} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-base font-medium tracking-[-0.01em] text-white">{card.title}</h3>
                  <p className="mt-2 text-[13.5px] font-light leading-6 text-white/68">{card.body}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}

export function HowItWorksSection() {
  return (
    <SectionShell
      id={howItWorks.id}
      eyebrow={howItWorks.eyebrow}
      title={howItWorks.title}
      lede={howItWorks.lede}
    >
      <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {howItWorks.steps.map((step, index) => {
          const Icon = stepIcons[step.icon as keyof typeof stepIcons]
          const isLast = index === howItWorks.steps.length - 1
          return (
            <Reveal as="li" key={step.title} delay={index * 90} className="relative">
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#141416] p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#a7f3d0]/25 bg-[#a7f3d0]/10 text-[#a7f3d0]">
                    <Icon size={17} strokeWidth={1.7} aria-hidden />
                  </span>
                  <span className="text-[11px] font-medium tabular-nums text-white/72">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-medium tracking-[-0.01em] text-white">{step.title}</h3>
                <p className="mt-2 text-[13.5px] font-light leading-6 text-white/68">{step.body}</p>
              </div>
              {!isLast ? (
                <>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.6}
                    aria-hidden
                    className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-white/72 xl:block"
                  />
                  <ArrowDown
                    size={16}
                    strokeWidth={1.6}
                    aria-hidden
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-white/72 md:hidden"
                  />
                </>
              ) : null}
            </Reveal>
          )
        })}
      </ol>
    </SectionShell>
  )
}