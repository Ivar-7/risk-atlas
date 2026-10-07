import { Activity, Building2, Radar, Waves } from 'lucide-react'
import { money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { scenarioLabel, type Scenario } from './model'

export function DashboardStats({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  const stats = [
    { label: 'Total insured value', value: money(run.metrics.total_tiv_kes), detail: `${run.metrics.locations.toLocaleString('en-KE')} locations · ${run.metrics.synthetic_locations} declared synthetic`, icon: Building2 },
    { label: `${scenarioLabel(scenario)} gross loss`, value: money(scenario.loss_kes), detail: 'Modelled from the current run', icon: Activity },
    { label: 'Locations with modelled loss', value: `${scenario.affected_locations} / ${run.metrics.locations}`, detail: `${money(scenario.affected_tiv_kes)} in affected value`, icon: Waves },
    { label: 'Annual average loss', value: money(run.metrics.aal_kes), detail: 'Integrated from assumed event frequencies', icon: Radar },
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
