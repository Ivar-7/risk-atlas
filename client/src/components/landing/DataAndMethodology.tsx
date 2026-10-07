import { ChevronDown } from 'lucide-react'
import { brand, dataTransparency as data, methodology } from '../../content/landing'
import Reveal from './Reveal'
import { SectionShell, toneClasses, type Tone } from './primitives'

const statusTone: Record<string, Tone> = { real: 'mint', proxy: 'amber', synthetic: 'slate' }

export function DataSection() {
  return (
    <SectionShell id={data.id} eyebrow={data.eyebrow} title={data.title} lede={data.lede}>
      <Reveal>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {Object.entries(data.legend).map(([key, entry]) => (
            <li key={key} className="flex items-center gap-2 text-[12.5px] text-white/65">
              <span className={`h-1.5 w-1.5 rounded-full ${toneClasses[statusTone[key]].dot}`} aria-hidden />
              <span className="font-medium text-white/70">{entry.label}</span>
              <span>{entry.hint}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={80} className="mt-8">
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#141416]">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">{data.title}</caption>
            <thead>
              <tr className="border-b border-white/10">
                {data.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => {
                const tone = toneClasses[statusTone[row.status]]
                return (
                  <tr key={row.file} className="border-b border-white/[0.06] last:border-b-0">
                    <th scope="row" className="px-6 py-4 align-top font-mono text-[12.5px] font-normal text-white/75">
                      {row.file}
                    </th>
                    <td className="px-6 py-4 align-top text-[13.5px] font-light leading-6 text-white/72">{row.what}</td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none ${tone.chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
                        {data.legend[row.status as keyof typeof data.legend].label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Reveal>

      <Reveal delay={120} className="mt-6">
        <p className="max-w-3xl text-[12.5px] leading-6 text-white/75">{data.note}</p>
      </Reveal>
    </SectionShell>
  )
}

export function MethodologySection() {
  return (
    <SectionShell
      id={methodology.id}
      eyebrow={methodology.eyebrow}
      title={methodology.title}
      lede={methodology.lede}
      alt
    >
      <div className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
        {methodology.items.map((item) => (
          <details key={item.title} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a78bfa] sm:px-7 [&::-webkit-details-marker]:hidden">
              {item.title}
              <ChevronDown
                size={16}
                strokeWidth={1.8}
                aria-hidden
                className="shrink-0 text-white/62 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="px-6 pb-6 sm:px-7">
              <p className="text-[13.5px] font-light leading-7 text-white/72">{item.body}</p>
              {'tableRows' in item && item.tableRows ? (
                <table className="mt-5 w-full max-w-md border-collapse text-left">
                  <caption className="pb-2 text-left text-[11px] uppercase tracking-[0.12em] text-white/75">
                    {item.tableCaption}
                  </caption>
                  <thead>
                    <tr className="border-b border-white/10">
                      {item.tableColumns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/75"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.tableRows.map((row) => (
                      <tr key={row.label} className="border-b border-white/[0.06] last:border-b-0">
                        <th scope="row" className="py-2.5 pr-4 text-[13px] font-normal text-white/70">
                          {row.label}
                        </th>
                        <td className="py-2.5 text-[13px] tabular-nums text-white/68">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </details>
        ))}
      </div>

      <Reveal delay={80} className="mt-6">
        <a
          href={brand.assumptionsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 text-[13.5px] text-white/72 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
        >
          {methodology.docsLinkLabel}
        </a>
      </Reveal>
    </SectionShell>
  )
}