import { useRef } from 'react'
import { CloudRain, House, ChartNoAxesCombined, SlidersHorizontal } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { pipeline } from '../../content/landing'
import { Stagger, StaggerItem } from '../ui/landing-motion'

const icons = [CloudRain, SlidersHorizontal, House, ChartNoAxesCombined]

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const lineProgress = useTransform(scrollYProgress, [0, 0.6], [0, 1])

  return (
    <section ref={sectionRef} id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-28 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 id="how-it-works-title" className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
        <Stagger className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pipeline.map((step, index) => {
            const Icon = icons[index]
            return (
              <StaggerItem key={step.title} className="border-t border-[#10294F]/20 pt-5">
                <Icon size={24} strokeWidth={1.75} aria-hidden="true" className="text-[#D8184B]" />
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{step.body}</p>
              </StaggerItem>
            )
          })}
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-px origin-left bg-[#D8184B] lg:block" style={{ scaleX: reduced ? 1 : lineProgress }} />
        </Stagger>
      </div>
    </section>
  )
}
