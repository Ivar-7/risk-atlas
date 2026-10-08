import { createPortal } from 'react-dom'
import { MotionConfig } from 'motion/react'
import { Header } from '../components/landing/Header'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Outputs } from '../components/landing/Outputs'
import { DataAndLimits } from '../components/landing/DataAndLimits'
import { Footer } from '../components/landing/Footer'
import { ScrollProgress } from '../components/ui/ScrollProgress'

export default function Landing() {
  const headerHost = document.getElementById('landing-header')
  const heroHost = document.getElementById('hero-content')
  const footerHost = document.getElementById('landing-footer')

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white text-[#10294F] [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif] font-normal antialiased">
        {headerHost ? createPortal(<Header />, headerHost) : null}
        {heroHost ? createPortal(<Hero />, heroHost) : null}
        <ScrollProgress />
        <HowItWorks />
        <Outputs />
        <DataAndLimits />
        {footerHost ? createPortal(<Footer />, footerHost) : null}
      </div>
    </MotionConfig>
  )
}
