import { useEffect, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { navLinks } from '../../content/landing'
import { Reveal } from '../ui/landing-motion'
import { KineticNavigation } from '../ui/sterling-gate-kinetic-navigation'

function isPastHero() {
  const hero = document.querySelector('.hero')
  return hero ? hero.getBoundingClientRect().bottom <= 64 : false
}

export function Header() {
  const { scrollY } = useScroll()
  const [pastHero, setPastHero] = useState(isPastHero)

  useMotionValueEvent(scrollY, 'change', () => setPastHero(isPastHero()))

  useEffect(() => {
    const update = () => setPastHero(isPastHero())
    window.addEventListener('resize', update)
    update()
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <Reveal onLoad fadeOnly>
      <KineticNavigation links={navLinks} pastHero={pastHero} />
    </Reveal>
  )
}
