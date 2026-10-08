import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { useReducedMotion } from 'motion/react'
import { GetStartedButton } from './get-started-button'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase)
  CustomEase.create('riskAtlasNav', '0.65,0.01,0.05,0.99')
}

type NavigationLink = { label: string; href: string }

export function KineticNavigation({ links, pastHero }: { links: NavigationLink[]; pastHero: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const pendingHrefRef = useRef<string | null>(null)
  const restoreFocusRef = useRef(false)
  const reducedRef = useRef(false)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  reducedRef.current = Boolean(reduced)

  useLayoutEffect(() => {
    const root = rootRef.current
    const overlay = overlayRef.current
    if (!root || !overlay) return

    const panels = root.querySelectorAll<HTMLElement>('[data-menu-panel]')
    const items = root.querySelectorAll<HTMLElement>('[data-menu-item]')
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        paused: true,
        onComplete: () => root.querySelector<HTMLAnchorElement>('[data-menu-item] a')?.focus(),
        onReverseComplete: () => {
          gsap.set(overlay, { autoAlpha: 0 })
          if (pendingHrefRef.current) {
            const href = pendingHrefRef.current
            pendingHrefRef.current = null
            history.pushState(null, '', href)
            document.querySelector(href)?.scrollIntoView({ behavior: reducedRef.current ? 'instant' : 'smooth' })
          } else if (restoreFocusRef.current) {
            buttonRef.current?.focus()
          }
          restoreFocusRef.current = false
        },
      })

      timeline
        .set(overlay, { autoAlpha: 1 }, 0)
        .fromTo(panels, { xPercent: 101 }, { xPercent: 0, duration: 0.6, stagger: 0.1, ease: 'riskAtlasNav' }, 0)
        .fromTo(items, { yPercent: 35, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out' }, 0.25)

      timelineRef.current = timeline
    }, root)

    return () => {
      timelineRef.current = null
      context.revert()
    }
  }, [])

  useEffect(() => {
    const timeline = timelineRef.current
    const overlay = overlayRef.current
    const root = rootRef.current
    if (!timeline || !overlay || !root) return

    if (reduced) {
      timeline.pause(open ? timeline.duration() : 0)
      gsap.set(overlay, { autoAlpha: open ? 1 : 0 })
      gsap.set(root.querySelectorAll('[data-menu-panel]'), { xPercent: open ? 0 : 101 })
      gsap.set(root.querySelectorAll('[data-menu-item]'), { yPercent: 0, opacity: 1 })
      if (open) root.querySelector<HTMLAnchorElement>('[data-menu-item] a')?.focus()
      else {
        if (pendingHrefRef.current) {
          const href = pendingHrefRef.current
          pendingHrefRef.current = null
          history.pushState(null, '', href)
          document.querySelector(href)?.scrollIntoView({ behavior: 'instant' })
        } else if (restoreFocusRef.current) buttonRef.current?.focus()
        restoreFocusRef.current = false
      }
      return
    }

    if (open) {
      gsap.set(overlay, { autoAlpha: 1 })
      timeline.play()
    } else {
      timeline.reverse()
    }
  }, [open, reduced])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        restoreFocusRef.current = true
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const focusables = [
        ...Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>('[data-header-action]') ?? []),
        buttonRef.current,
        ...Array.from(overlayRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
      ].filter((element): element is HTMLAnchorElement | HTMLButtonElement => element !== null)
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        restoreFocusRef.current = true
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handleOutsideClick)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [open])

  const close = () => {
    restoreFocusRef.current = true
    setOpen(false)
  }

  return (
    <div ref={rootRef}>
      <header className={`relative z-20 border-b [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif] transition-[border-color,background-color,backdrop-filter] duration-200 ${pastHero ? 'border-[#10294F]/10 bg-white/95 text-[#10294F] backdrop-blur-sm' : open ? 'border-transparent bg-[#10294F]/90 text-white backdrop-blur-sm' : 'border-transparent bg-transparent text-white'}`}>
        <div className="flex h-16 w-full items-center justify-between gap-1 px-5 max-[360px]:px-2 sm:gap-2 sm:px-6 lg:px-8">
          <a href="/" aria-label="Risk Atlas home" className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D8184B]">
            <img src={pastHero ? '/assets/logo-horizontal.svg' : '/assets/logo-horizontal-dark.svg'} alt="Risk Atlas" className="h-8 w-auto max-[360px]:h-[26px]" />
          </a>
          <div className="flex shrink-0 items-center gap-1 max-[360px]:gap-0.5 sm:gap-2">
            <GetStartedButton href="/login/" label="Log in" compactLabel="Login" variant="outline" onLight={pastHero} />
            <GetStartedButton href="/register/" label="Get Started" compactLabel="Start" />
            <button
              ref={buttonRef}
              type="button"
              aria-controls="landing-menu"
              aria-expanded={open}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => {
                restoreFocusRef.current = open
                setOpen((value) => !value)
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 max-[360px]:h-8 max-[360px]:w-8 sm:h-10 sm:w-auto sm:gap-3 sm:px-4 ${pastHero ? 'border-[#10294F]/20 hover:border-[#D8184B] hover:text-[#D8184B] focus-visible:outline-[#D8184B]' : 'border-white/40 hover:border-white hover:bg-white/10 focus-visible:outline-white'}`}
            >
              <span className="hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
              {open ? <X size={18} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={18} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <div
        ref={overlayRef}
        id="landing-menu"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-5 top-[4.5rem] z-10 invisible max-h-[45dvh] w-[min(26rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl opacity-0 shadow-xl sm:right-6 lg:right-8 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div data-menu-panel className="absolute inset-0 bg-[#D8184B]" />
        <div data-menu-panel className="absolute inset-0 bg-[#10294F]" />
        <button type="button" aria-label="Close navigation menu" tabIndex={-1} onClick={close} className="absolute inset-0 z-0 cursor-default" />
        <nav aria-label="Landing page sections" className="relative z-10 max-h-[45dvh] overflow-y-auto p-6 sm:p-7">
          <ul className="space-y-3 sm:space-y-4">
            {links.map((link) => (
              <li data-menu-item key={link.href} className="w-fit overflow-hidden">
                <a
                  href={link.href}
                  onClick={(event) => {
                    event.preventDefault()
                    pendingHrefRef.current = link.href
                    restoreFocusRef.current = false
                    setOpen(false)
                  }}
                  className="block rounded-sm text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-tight text-white transition-colors duration-200 hover:text-[#B5B8BD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
