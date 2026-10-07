import { Activity, Building2, Radar, Waves } from 'lucide-react'
import { exposureRows, formatKes, totalExposureKes, type ScenarioSummary } from './model'

export function DashboardStats({ summary }: { summary: ScenarioSummary }) {
  const stats = [
    { label: 'Synthetic insured value', value: formatKes(totalExposureKes), detail: `${exposureRows.length} generated locations`, icon: Building2 },
    { label: `${summary.scenario.label} gross loss`, value: formatKes(summary.lossKes, 2), detail: 'Illustrative proxy-based estimate', icon: Activity },
    { label: 'Locations with proxy signal', value: `${summary.affectedCount} / ${exposureRows.length}`, detail: `${formatKes(summary.affectedTivKes)} in affected value`, icon: Waves },
    { label: 'Hotspot validation', value: '12 / 24', detail: 'Named hotspots flagged by starter proxy', icon: Radar },
  ]

  return <>
    {stats.map(({ label, value, detail, icon: Icon }) => (
      <div key={label} className="flex min-h-40 flex-col rounded-2xl border border-white/10 bg-[#141b1d] p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs leading-5 text-white/50">{label}</p>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-200/[0.08] text-emerald-200/75"><Icon size={17} strokeWidth={1.6} /></span>
        </div>
        <p className="mt-auto pt-5 text-[27px] font-semibold tracking-[-0.045em] text-white">{value}</p>
        <p className="mt-1 text-[11px] leading-4 text-white/35">{detail}</p>
      </div>
    ))}
  </>
}
