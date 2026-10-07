import { exposureRows, scoreFor, type ScenarioSummary } from './model'
import { Panel, PanelHeading } from './panel'

const west = Math.min(...exposureRows.map((row) => row[2]))
const east = Math.max(...exposureRows.map((row) => row[2]))
const south = Math.min(...exposureRows.map((row) => row[1]))
const north = Math.max(...exposureRows.map((row) => row[1]))
const plot = { x: 36, y: 24, width: 568, height: 282 }

function pointFor(latitude: number, longitude: number) {
  return {
    x: plot.x + ((longitude - west) / (east - west)) * plot.width,
    y: plot.y + ((north - latitude) / (north - south)) * plot.height,
  }
}

export function ExposureMap({ summary }: { summary: ScenarioSummary }) {
  return (
    <Panel id="exposure-map" className="p-5 sm:col-span-2 sm:p-6">
      <PanelHeading
        eyebrow="Exposure"
        title="Nairobi location signal"
        description="Synthetic building coordinates colored by the selected susceptibility proxy."
        action={<span className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-[11px] text-cyan-100">{summary.affectedCount} flagged</span>}
      />
      <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e181b]">
        <svg viewBox="0 0 640 350" role="img" aria-label={`${summary.affectedCount} of 600 synthetic Nairobi locations have a non-zero proxy score in the ${summary.scenario.label} scenario`} className="block h-auto w-full">
          <defs>
            <pattern id="exposure-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#b7c9be" strokeOpacity=".07" /></pattern>
          </defs>
          <rect x={plot.x} y={plot.y} width={plot.width} height={plot.height} fill="url(#exposure-grid)" stroke="#fff" strokeOpacity=".12" />
          {exposureRows.map((row) => {
            const score = scoreFor(row, summary.scenario)
            const point = pointFor(row[1], row[2])
            return <circle key={row[0]} cx={point.x} cy={point.y} r={score > 0 ? 2.5 + score * 4 : 1.6} fill={score > 0 ? '#67e8f9' : '#d5e5e0'} fillOpacity={score > 0 ? 0.55 + score * 0.45 : 0.25} />
          })}
          <g fill="#8da39e" fontFamily="Inter, sans-serif" fontSize="10">
            <text x="36" y="330">{west.toFixed(2)}°E</text>
            <text x="604" y="330" textAnchor="end">{east.toFixed(2)}°E</text>
            <text x="37" y="17">{Math.abs(north).toFixed(2)}°S</text>
            <text x="37" y="318">{Math.abs(south).toFixed(2)}°S</text>
            <text x="604" y="17" textAnchor="end" letterSpacing="2">NAIROBI</text>
          </g>
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/40">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Proxy signal</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/30" /> No signal</span>
        <span>Coordinate scatter, not an inundation map</span>
      </div>
    </Panel>
  )
}
