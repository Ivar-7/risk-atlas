import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Rendered element. `div` by default. */
  as?: ElementType
  className?: string
  /** Stagger in milliseconds. */
  delay?: number
}

/**
 * Subtle scroll reveal: fade plus a small vertical translate, triggered once
 * when the node first enters the viewport.
 *
 * Motion is opt-out in CSS (see `.reveal` in src/index.css) so anything using
 * prefers-reduced-motion never gets the hidden starting state at all. The
 * observer is skipped entirely in that case, which keeps content visible for
 * users with JS-disabled class animations or an environment without IO.
 */
export default function Reveal({ children, as = 'div', className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const Tag = as as 'div'
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      data-reveal={shown ? 'shown' : 'hidden'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  )
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}