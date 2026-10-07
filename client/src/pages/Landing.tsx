import { TopNav } from '../components/landing/TopNav'
import { HowItWorksSection, ProblemSection } from '../components/landing/ProblemAndPipeline'
import { OutputsSection } from '../components/landing/OutputsSection'
import { AiLayerSection } from '../components/landing/AiLayerSection'
import { ValidationSection } from '../components/landing/ValidationSection'
import { DataSection, MethodologySection } from '../components/landing/DataAndMethodology'
import { CtaBand, LandingFooter, TeamSection } from '../components/landing/TeamCtaFooter'

/**
 * Everything below the static hero in client/index.html.
 *
 * The hero stays untouched: index.html renders it as-is and this tree is
 * mounted into the #landing-sections element underneath it.
 */
export default function Landing() {
  return (
    <div id="top" className="bg-[#000000] text-white [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif] antialiased">
      <TopNav />
      <main>
        <ProblemSection />
        <HowItWorksSection />
        <OutputsSection />
        <AiLayerSection />
        <ValidationSection />
        <DataSection />
        <MethodologySection />
        <TeamSection />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  )
}