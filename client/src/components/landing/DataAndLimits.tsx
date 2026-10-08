import { dataAndLimits } from '../../content/landing'
import { Reveal } from '../ui/landing-motion'

export function DataAndLimits() {
  return (
    <section id="data" aria-labelledby="data-title" className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-28 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 id="data-title" className="text-3xl font-semibold tracking-tight md:text-4xl">Data and limits</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal fromX={-20}>
            <h3 className="text-lg font-semibold">Data used</h3>
            <dl className="mt-5 space-y-5 text-sm leading-6">
              <div><dt className="font-semibold">Real</dt><dd className="text-[#6B7280]">{dataAndLimits.real}</dd></div>
              <div><dt className="font-semibold">Sample exposure</dt><dd className="text-[#6B7280]">{dataAndLimits.sample}</dd></div>
              <div><dt className="font-semibold">Proxy</dt><dd className="text-[#6B7280]">{dataAndLimits.proxy}</dd></div>
            </dl>
          </Reveal>
          <Reveal fromX={20}>
            <h3 className="text-lg font-semibold">Known limits</h3>
            <p className="mt-5 max-w-prose text-sm leading-6 text-[#6B7280]">{dataAndLimits.limits}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
