import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type StoryScrollFooterProps = { children: ReactNode }
type StoryPanelProps = { children: ReactNode; className: string; label: string }

export function StoryPanel({ children, className, label }: StoryPanelProps) {
  return (
    <section data-story-panel aria-label={label} className={`relative flex min-h-svh w-full overflow-hidden ${className}`}>
      <div data-story-inner className="mx-auto flex w-full max-w-6xl flex-col px-5 py-8 sm:px-8 md:min-h-svh md:py-12 lg:px-10">
        {children}
      </div>
    </section>
  )
}

export function StoryScrollFooter({ children }: StoryScrollFooterProps) {
  const footerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const footer = footerRef.current
    if (!footer) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const panels = Array.from(footer.querySelectorAll<HTMLElement>('[data-story-panel]'))

      panels.forEach((panel, index) => {
        const fitsViewport = panel.scrollHeight <= window.innerHeight + 1
        gsap.set(panel, { zIndex: index + 1 })
        const inner = panel.querySelector<HTMLElement>('[data-story-inner]')
        if (index > 0 && inner) {
          gsap.fromTo(inner,
            { rotation: 30, transformOrigin: 'bottom left' },
            {
              rotation: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                start: 'top bottom',
                end: 'top 25%',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          )
        }

        if (index < panels.length - 1 && fitsViewport) {
          ScrollTrigger.create({
            trigger: panel,
            start: 'bottom bottom',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
            anticipatePin: 1,
          })
        }
      })

      const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())

      return () => {
        cancelAnimationFrame(refreshFrame)
        panels.forEach((panel) => {
          const inner = panel.querySelector<HTMLElement>('[data-story-inner]')
          if (inner) gsap.set(inner, { clearProps: 'transform,transformOrigin' })
          gsap.set(panel, { clearProps: 'zIndex' })
        })
      }
    })

    return () => media.revert()
  }, { scope: footerRef })

  return <footer ref={footerRef} aria-label="Risk Atlas story and site footer" className="relative w-full [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">{children}</footer>
}
