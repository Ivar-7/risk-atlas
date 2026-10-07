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
          <img src="/assets/logo-horizontal-dark.svg" alt="" aria-hidden="true" className="h-8 w-auto" />
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
