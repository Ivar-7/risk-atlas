import { brand, outputs } from '../../content/landing'
import Reveal from './Reveal'
import { IllustrativeTag, PrimaryLink, SectionShell, SyntheticBadge } from './primitives'

const VIEWBOX_W = 560
const VIEWBOX_H = 340
const PLOT = { left: 66, right: 26, top: 26, bottom: 84 }
const PLOT_W = VIEWBOX_W - PLOT.left - PLOT.right
const PLOT_H = 218
const BASELINE = PLOT.top + PLOT_H

// Illustrative geometry only. These are normalised drawing coordinates, not
// loss values: the chart is labelled and unnumbered by design.
const CURVE_POINTS = [
  { x: 78, y: 238 },
  { x: 162, y: 220 },
  { x: 248, y: 194 },
  { x: 332, y: 142 },
  { x: 414, y: 96 },
  { x: 486, y: 62 },
]

function curvePath() {
  // Catmull-Rom-ish smoothing via midpoint quadratics: readable, no dependency.
  if (CURVE_POINTS.length < 2) return ''
  let d = `M ${CURVE_POINTS[0].x} ${CURVE_POINTS[0].y}`
  for (let i = 1; i < CURVE_POINTS.length; i += 1) {
    const prev = CURVE_POINTS[i - 1]
    const curr = CURVE_POINTS[i]
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`
  }
  const last = CURVE_POINTS[CURVE_POINTS.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

function EpCurveCard() {
  const { epCurve } = outputs.cards
  const path = curvePath()
  const areaPath = `${path} L ${CURVE_POINTS[CURVE_POINTS.length - 1].x} ${BASELINE} L ${CURVE_POINTS[0].x} ${BASELINE} Z`
  const gridRows = [0, 1, 2, 3]

  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#141416] p-6">
      <figcaption>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-base font-medium tracking-[-0.01em] text-white">{epCurve.title}</h3>
          <IllustrativeTag />
        </div>
        <p className="mt-2 text-[13.5px] font-light leading-6 text-white/68">{epCurve.description}</p>
      </figcaption>

      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="mt-6 w-full max-w-[30rem]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Illustrative exceedance probability curve. ${epCurve.axisX} on the horizontal axis and ${epCurve.axisY} on the vertical axis. Loss rises as the return period lengthens. Shapes only, no real values.`}
      >
        <defs>
          <linearGradient id="ep-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridRows.map((row) => {
          const y = BASELINE - (row * PLOT_H) / gridRows.length
          return (
            <line
              key={row}
              x1={PLOT.left}
              y1={y}
              x2={PLOT.left + PLOT_W}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          )
        })}

        <path d={areaPath} fill="url(#ep-fill)" />
        <path d={path} fill="none" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
        {CURVE_POINTS.map((point) => (
          <circle key={point.x} cx={point.x} cy={point.y} r="3.5" fill="#a7f3d0" stroke="#141416" strokeWidth="2" />
        ))}

        <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={BASELINE} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
        <line x1={PLOT.left} y1={BASELINE} x2={PLOT.left + PLOT_W} y2={BASELINE} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />

        {epCurve.xTicks.map((tick) => (
          <text
            key={tick.label}
            x={tick.x}
            y={BASELINE + 20}
            fill="rgba(255,255,255,0.55)"
            fontSize="11"
            textAnchor="middle"
          >
            {tick.label}
          </text>
        ))}

        <text
          x={PLOT.left + PLOT_W / 2}
          y={BASELINE + 52}
          fill="rgba(255,255,255,0.75)"
          fontSize="12"
          textAnchor="middle"
        >
          {epCurve.axisX}
        </text>
        <text
          x={-(PLOT.top + PLOT_H / 2)}
          y={16}
          fill="rgba(255,255,255,0.75)"
          fontSize="12"
          textAnchor="middle"
          transform="rotate(-90)"
        >
          {epCurve.axisY}
        </text>
      </svg>

      <p className="mt-3 text-[11.5px] leading-5 text-white/72">
        Axes are labelled and unnumbered on purpose: no loss value has been run through this chart.
      </p>
    </figure>
  )
}

function LossByClassCard() {
  const { lossByClass } = outputs.cards
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#141416] p-6">
      <figcaption>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-base font-medium tracking-[-0.01em] text-white">{lossByClass.title}</h3>
          <IllustrativeTag />
        </div>
        <p className="mt-2 text-[13.5px] font-light leading-6 text-white/68">{lossByClass.description}</p>
      </figcaption>

      <div
          className="mt-7 flex flex-1 flex-col justify-center gap-4"
          role="img"
          aria-label="Illustrative horizontal bars comparing relative loss across four housing classes. Bar lengths are placeholders with no underlying values."
        >
        {lossByClass.classes.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
            <span className="text-[12.5px] text-white/72">{row.label}</span>
            <span className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${row.width}%`, backgroundColor: row.color, opacity: 0.75 }}
              />
            </span>
          </div>
        ))}
        <p className="pt-2 text-[11px] text-white/72">{lossByClass.axisX}</p>
      </div>
    </figure>
  )
}

function ReturnPeriodTableCard() {
  const { returnPeriods } = outputs.cards
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#141416] p-6">
      <figcaption>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-base font-medium tracking-[-0.01em] text-white">{returnPeriods.title}</h3>
          <IllustrativeTag />
        </div>
        <p className="mt-2 text-[13.5px] font-light leading-6 text-white/68">{returnPeriods.description}</p>
      </figcaption>

      <div className="mt-6 flex-1 overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10">
              {returnPeriods.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="pb-2.5 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {returnPeriods.rows.map((row) => (
              <tr key={row.label} className="border-b border-white/[0.06] last:border-b-0">
                <th scope="row" className="py-3 pr-3 text-[13.5px] font-medium text-white/75">
                  {row.label}
                </th>
                <td className="py-3 pr-3 text-[13.5px] tabular-nums text-white/75">{row.loss}</td>
                <td className="py-3 text-[13.5px] tabular-nums text-white/75">{row.affected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11.5px] leading-5 text-white/72">{returnPeriods.footnote}</p>
    </figure>
  )
}

export function OutputsSection() {
  return (
    <SectionShell
      id={outputs.id}
      eyebrow={outputs.eyebrow}
      title={outputs.title}
      lede={outputs.lede}
      alt
      headingExtra={
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <SyntheticBadge />
          <span className="text-[12.5px] text-white/62">
            Every card below shows shape, not results. Run the model for numbers.
          </span>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <EpCurveCard />
        </Reveal>
        <Reveal delay={90}>
          <LossByClassCard />
        </Reveal>
        <Reveal delay={60} className="lg:col-span-2">
          <ReturnPeriodTableCard />
        </Reveal>
      </div>

      <Reveal className="mt-10 flex justify-center">
        <PrimaryLink href={brand.modelHref}>{outputs.primaryCta}</PrimaryLink>
      </Reveal>
    </SectionShell>
  )
}