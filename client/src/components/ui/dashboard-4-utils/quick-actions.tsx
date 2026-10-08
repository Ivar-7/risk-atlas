import { Download } from 'lucide-react'
import { money, presentModelText } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { downloadScenario, scenarioLabel, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'

export function QuickActions({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  return <Panel id="assumptions" className="p-5 sm:p-6">
    <PanelHeading eyebrow="Model provenance" title="Data and assumptions" description="Source labels and modeling choices recorded with the current run." action={<button type="button" onClick={() => downloadScenario(run, scenario)} className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><Download size={15} /> Export {scenarioLabel(scenario)} CSV</button>} />
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div><h3 className="mb-3 text-sm font-semibold text-foreground">Run provenance</h3><div className="divide-y divide-border/70 rounded-lg border border-border/70">{Object.entries(run.labels).map(([key, value]) => <div key={key} className="px-4 py-3"><p className="text-xs font-medium capitalize text-foreground">{key.replaceAll('_', ' ')}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{presentModelText(value)}</p></div>)}</div></div>
      <div><h3 className="mb-3 text-sm font-semibold text-foreground">Assumptions register</h3><div className="divide-y divide-border/70 rounded-lg border border-border/70">{run.assumptions.map((item) => <div key={item.id} className="px-4 py-3"><p className="text-xs font-medium text-foreground">{item.title}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-primary/75">{item.id} · {presentModelText(item.provenance)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{presentModelText(item.statement)}</p></div>)}</div></div>
    </div>
    <div className="mt-6">
      <div className="rounded-lg border border-border/70 p-4"><h3 className="text-sm font-semibold">Frequency sensitivity</h3><p className="mt-1 text-xs text-muted-foreground">All assumed return periods are multiplied by the factor shown. Event losses stay the same; gross and net AAL change.</p><table className="mt-3 w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-2">Return periods</th><th className="text-right">Gross AAL</th><th className="text-right">Net AAL</th></tr></thead><tbody>{run.sensitivity.return_periods.map((row) => <tr key={row.return_period_multiplier} className="border-t border-border/60"><td className="py-2">{row.return_period_multiplier}× {row.return_period_multiplier === 1 ? '(current)' : ''}</td><td className="text-right">{money(row.aal_kes)}</td><td className="text-right">{money(row.net_aal_kes)}</td></tr>)}</tbody></table></div>
    </div>
  </Panel>
}
