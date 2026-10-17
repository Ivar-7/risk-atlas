import { brand, footerStory } from '../../content/landing'
import { StoryPanel, StoryScrollFooter } from '../ui/story-scroll'

const headingClass = 'text-[clamp(3.25rem,10vw,9.5rem)] font-medium uppercase leading-[0.88] tracking-[-0.06em] [@media(max-height:759px)]:text-[clamp(2.75rem,7vw,6.5rem)]'
const ruleClass = 'border-t border-current/30'

function PanelHeading({ lines }: { lines: string[] }) {
  return <h2 className={headingClass}>{lines.map((line) => <span className="block" key={line}>{line}</span>)}</h2>
}

function PanelTop({ label }: { label: string }) {
  return <p className={`${ruleClass} pt-5 text-xs uppercase tracking-[0.18em]`}>{label}</p>
}

export function Footer() {
  return (
    <StoryScrollFooter>
      <StoryPanel label="What Risk Atlas does" className="bg-[#10294F] text-white">
        <PanelTop label={footerStory.introduction.label} />
        <div className="flex flex-1 items-center py-16"><PanelHeading lines={footerStory.introduction.heading} /></div>
        <p className={`${ruleClass} max-w-2xl pt-5 text-base leading-relaxed text-[#D4D9E1] sm:text-xl`}>{footerStory.introduction.body}</p>
      </StoryPanel>

      <StoryPanel label="The Risk Atlas model" className="bg-white text-[#10294F]">
        <PanelTop label={footerStory.model.label} />
        <div className="py-10 md:py-12"><PanelHeading lines={footerStory.model.heading} /></div>
        <p className="max-w-2xl text-base leading-relaxed sm:text-lg">{footerStory.model.body}</p>
        <div className="mt-auto grid gap-x-8 gap-y-5 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerStory.model.stages.map((stage) => (
            <div key={stage.title} className={`${ruleClass} pt-4`}>
              <h3 className="text-base font-medium">{stage.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5D6778]">{stage.body}</p>
            </div>
          ))}
        </div>
      </StoryPanel>

      <StoryPanel label="The Risk Atlas workspace" className="bg-[#F8FAFC] text-[#10294F]">
        <PanelTop label={footerStory.workspace.label} />
        <div className="py-10 md:py-12"><PanelHeading lines={footerStory.workspace.heading} /></div>
        <p className="max-w-2xl text-base leading-relaxed sm:text-lg">{footerStory.workspace.body}</p>
        <div className="mt-auto grid gap-x-8 gap-y-5 pt-10 sm:grid-cols-2 md:grid-cols-3">
          {footerStory.workspace.features.map((feature) => (
            <div key={feature.title} className={`${ruleClass} pt-4`}>
              <h3 className="text-base font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5D6778]">{feature.body}</p>
            </div>
          ))}
        </div>
      </StoryPanel>

      <StoryPanel label="Risk Atlas evidence and limits" className="bg-[#D8184B] text-white">
        <PanelTop label={footerStory.evidence.label} />
        <div className="py-10 md:py-12"><PanelHeading lines={footerStory.evidence.heading} /></div>
        <p className="max-w-2xl text-base leading-relaxed sm:text-lg">{footerStory.evidence.body}</p>
        <div className="mt-auto grid gap-x-8 gap-y-6 pt-10 sm:grid-cols-3">
          {footerStory.evidence.figures.map((figure) => (
            <div key={figure.value} className={`${ruleClass} pt-4`}>
              <p className="text-[clamp(3rem,6vw,6rem)] font-medium leading-none tracking-tight">{figure.value}</p>
              <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-white/90">{figure.label}</p>
            </div>
          ))}
        </div>
        <p className={`${ruleClass} mt-8 pt-5 text-sm leading-relaxed text-white/90`}>{footerStory.evidence.limit}</p>
      </StoryPanel>

      <StoryPanel label="Risk Atlas links and disclaimer" className="bg-[#10294F] text-white">
        <PanelTop label={footerStory.closing.label} />
        <div className="flex flex-1 flex-col justify-center gap-8 py-12">
          <PanelHeading lines={footerStory.closing.heading} />
          <p className="max-w-2xl text-base leading-relaxed text-[#D4D9E1] sm:text-xl">{footerStory.closing.body}</p>
        </div>
        <div className={`${ruleClass} flex flex-wrap items-center justify-between gap-6 pt-5`}>
          <a href={brand.homeHref} aria-label="Risk Atlas home" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <img src="/assets/logo-horizontal-dark.svg" alt="Risk Atlas" className="h-12 w-auto max-w-full sm:h-16" />
          </a>
          <a href={brand.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-sm text-sm underline underline-offset-4 hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Risk Atlas on GitHub (opens in a new tab)">GitHub</a>
        </div>
        <p className="mt-5 text-sm leading-6 text-[#D4D9E1]">{brand.disclaimer}</p>
      </StoryPanel>
    </StoryScrollFooter>
  )
}
