import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { brand, navLinks } from '../../content/landing'
import { PrimaryLink } from './primitives'

export function TopNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <nav
      aria-label="Landing page sections"
      className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#000000]/85 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5 sm:px-8 lg:px-10">
        <a
          href="#top"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white"
          aria-label={`${brand.wordmark} home`}
        >
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" aria-hidden>
            <path d="M20 2.5 35 11v18L20 37.5 5 29V11Z" stroke="#a7f3d0" strokeWidth="2.2" strokeLinejoin="round" />
            <path
              d="M9 24c4.8-3.8 8.7-3.8 13.2 0 3.1 2.6 5.8 2.6 8.8.5M9 18.1c4.8-3.8 8.7-3.8 13.2 0 3.1 2.6 5.8 2.6 8.8.5"
              stroke="#a7f3d0"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="28.5" cy="11.8" r="1.4" fill="#a7f3d0" />
          </svg>
          {brand.wordmark}
        </a>

        <ul className="ml-auto hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-white/72 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <PrimaryLink href={brand.modelHref} className="h-10 px-5 text-[13px]">
            View the model
          </PrimaryLink>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? 'Close section menu' : 'Open section menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#181818] text-white/80 transition-colors hover:text-white lg:hidden"
          >
            {open ? <X size={18} strokeWidth={1.7} aria-hidden /> : <Menu size={18} strokeWidth={1.7} aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-white/[0.07] bg-[#0a0a0a] px-5 pb-5 pt-3 sm:px-8 lg:hidden"
        >
          <ul className="grid gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-[15px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  )
}