import { clsLabel, money, presentModelText } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { Panel, PanelHeading } from './panel'

export function AiEvidence({ run }: { run: RunResult }) {
  const source = run.interventions.free_text.source ?? 'none'
  const groups = run.interventions.free_text.groups ?? []
  return <div className="space-y-4">
    <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Model contribution" title="What changed in this run" description="Separate model-backed extraction from the deterministic drainage rule." />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Exposure extraction</p><p className="mt-2 text-lg font-semibold">{source === 'openai' ? 'Model-backed and reviewed' : source === 'rules' ? 'Validated rules' : 'No added exposure'}</p><p className="mt-1 text-xs text-muted-foreground">{run.interventions.free_text.rows_added} sample rows added</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Added exposure effect · 1-in-100</p><p className="mt-2 text-lg font-semibold">{money(run.metrics.exposure_delta_1_in_100_kes)}</p><p className="mt-1 text-xs text-muted-foreground">Against the same model run without added rows</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Drainage rule effect · 1-in-100</p><p className="mt-2 text-lg font-semibold">{money(run.metrics.drainage_delta_1_in_100_kes)}</p><p className="mt-1 text-xs text-muted-foreground">Deterministic correction; {run.interventions.drainage.buildings_uplifted} locations uplifted</p></div>
      </div>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">{presentModelText(run.interventions.effect)}</p>
      {groups.length > 0 && <div className="mt-5 overflow-x-auto"><table className="min-w-[550px] w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-2">Reviewed group</th><th>Place</th><th className="text-right">Count</th><th className="text-right">Value each</th></tr></thead><tbody>{groups.map((group, index) => <tr key={`${group.place}-${index}`} className="border-t border-border/60"><td className="py-2">{clsLabel(group.housing_class)}</td><td>{group.place}</td><td className="text-right">{group.count}</td><td className="text-right">{money(group.tiv_each_kes)}</td></tr>)}</tbody></table></div>}
    </Panel>
    <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Underwriter note" title="Current run briefing" description="A deterministic summary of model outputs, not an AI-generated assessment." /><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{presentModelText(run.briefing)}</p></Panel>
  </div>
}
