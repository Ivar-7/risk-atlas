import { motion, useReducedMotion } from 'motion/react'
import { outputCards } from '../../content/landing'
import { ease, quickTransition, viewport } from '../../lib/motion'
import { Stagger, StaggerItem } from '../ui/landing-motion'

function EpCurve() {
  const reduced = useReducedMotion()

  return (
    <div className="mt-5 rounded-lg bg-white p-3">
      <div className="text-xs text-[#6B7280]">Illustrative</div>
      <svg viewBox="0 0 280 125" role="img" aria-label="Illustrative EP curve showing loss rising with return period" className="mt-2 h-auto w-full">
        <path d="M20 8V105H270" fill="none" stroke="#6B7280" strokeWidth="1.5" />
        <motion.path
          d="M22 94 C78 91 113 80 151 68 S225 31 266 14"
          fill="none" stroke="#D8184B" strokeWidth="3" strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={reduced ? undefined : { pathLength: 1 }}
          viewport={viewport}
          transition={{ duration: 1.4, ease }}
        />
        <text x="25" y="23" fill="#6B7280" fontSize="10">KES —</text>
        <text x="195" y="121" fill="#6B7280" fontSize="10">Return period</text>
      </svg>
    </div>
  )
}

export function Outputs() {
  const reduced = useReducedMotion()

  return (
    <section id="outputs" aria-labelledby="outputs-title" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 md:py-28 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 id="outputs-title" className="text-3xl font-semibold tracking-tight md:text-4xl">What you get</h2>
        <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
          {outputCards.map((card, index) => (
            <StaggerItem key={card.title} className="min-w-0">
              <motion.article
                className="h-full min-w-0 rounded-xl border border-[#10294F]/10 bg-white p-6"
                whileHover={reduced ? undefined : { y: -4 }}
                transition={quickTransition}
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">{card.body}</p>
                {index === 0 ? <EpCurve /> : null}
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
