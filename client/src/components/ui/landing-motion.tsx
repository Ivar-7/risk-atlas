import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { reveal, revealTransition, stagger, viewport } from '../../lib/motion'

type BaseProps = { children: ReactNode; className?: string }

export function Reveal({ children, className, fromX = 0, fadeOnly = false, onLoad = false }: BaseProps & { fromX?: number; fadeOnly?: boolean; onLoad?: boolean }) {
  const reduced = useReducedMotion()
  const hidden = fadeOnly || reduced ? { opacity: 0 } : fromX ? { opacity: 0, x: fromX } : reveal.hidden
  const visible = fadeOnly || reduced ? { opacity: 1 } : fromX ? { opacity: 1, x: 0 } : reveal.visible

  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      animate={onLoad ? 'visible' : undefined}
      whileInView={onLoad ? undefined : 'visible'}
      viewport={onLoad ? undefined : viewport}
      variants={{ hidden, visible: { ...visible, transition: revealTransition } }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className, onLoad = false }: BaseProps & { onLoad?: boolean }) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      animate={onLoad ? 'visible' : undefined}
      whileInView={onLoad ? undefined : 'visible'}
      viewport={onLoad ? undefined : viewport}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: BaseProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced ? { opacity: 1 } : reveal.hidden,
        visible: { opacity: 1, y: 0, transition: revealTransition },
      }}
    >
      {children}
    </motion.div>
  )
}
