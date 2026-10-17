import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { progressSpring } from '../../lib/motion'

export function ScrollProgress() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, progressSpring)

  if (reduced) return null

  return <motion.div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-[#D8184B]" style={{ scaleX }} />
}
