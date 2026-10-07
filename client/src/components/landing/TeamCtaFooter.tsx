import { Users } from 'lucide-react'
import { brand, cta, footer, team } from '../../content/landing'
import Reveal from './Reveal'
import { GhostLink, PrimaryLink, SectionShell } from './primitives'

export function TeamSection() {
  return (
    <SectionShell id={team.id} eyebrow={team.eyebrow} title={team.title} alt>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {team.members.map((member, index) => (
          <Reveal key={member.role} delay={index * 80}>
            <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#141416] p-6">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#a7f3d0]/25 bg-[#a7f3d0]/10 text-sm font-semibold tracking-[0.04em] text-[#a7f3d0]"
                >
                  {member.initials}
                </span>
                <div>
                  <h3 className="text-[15px] font-medium tracking-[-0.01em] text-white">{member.name}</h3>
                  <p className="mt-0.5 text-[12.5px] text-[#a7f3d0]/80">{member.role}</p>
                </div>
              </div>
              <p className="mt-5 text-[13.5px] font-light leading-6 text-white/68">{member.blurb}</p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal delay={240} className="mt-6 flex items-center gap-2 text-[12px] text-white/72">
        <Users size={14} strokeWidth={1.7} aria-hidden />
        {team.note}
      </Reveal>
    </SectionShell>
  )
}

export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="border-t border-white/[0.07] bg-[#08090a]">
      <div className="mx-auto w-full max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24 lg:px-10">
        <Reveal>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#b8f5da]">{cta.eyebrow}</p>
          <h2
            id="cta-heading"
            className="mt-4 text-[clamp(1.9rem,5vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white"
          >
            {cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] font-light leading-7 text-white/72">{cta.body}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryLink href={brand.modelHref}>{cta.primaryLabel}</PrimaryLink>
            <GhostLink href={brand.githubUrl} external>
              {cta.secondaryLabel}
            </GhostLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#000000]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white">
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden>
                <path
                  d="M20 2.5 35 11v18L20 37.5 5 29V11Z"
                  stroke="#a7f3d0"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 24c4.8-3.8 8.7-3.8 13.2 0 3.1 2.6 5.8 2.6 8.8.5M9 18.1c4.8-3.8 8.7-3.8 13.2 0 3.1 2.6 5.8 2.6 8.8.5"
                  stroke="#a7f3d0"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="28.5" cy="11.8" r="1.4" fill="#a7f3d0" />
              </svg>
              {brand.wordmark}
            </p>
            <p className="mt-3 text-[13px] font-light text-white/62">{brand.hackathon}</p>
          </div>

          <nav aria-label={footer.navLabel} className="flex flex-col gap-2.5">
            <a
              href={brand.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[13px] text-white/72 transition-colors hover:text-white"
            >
              GitHub
            </a>
            <a
              href={brand.assumptionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[13px] text-white/72 transition-colors hover:text-white"
            >
              docs/assumptions.md
            </a>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/[0.07] pt-6 text-[12px] leading-5 text-white/72">
          <strong className="font-medium text-white/65">{footer.disclaimerTitle}.</strong> {brand.disclaimer}
        </p>
      </div>
    </footer>
  )
}