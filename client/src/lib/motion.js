export const ease = /** @type {[number, number, number, number]} */ ([0.22, 1, 0.36, 1])

export const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const revealTransition = { duration: 0.7, ease }
export const stagger = 0.1
export const viewport = { once: true, margin: '-80px' }
export const quickTransition = { duration: 0.2, ease }
export const progressSpring = { stiffness: 100, damping: 30, restDelta: 0.001 }
