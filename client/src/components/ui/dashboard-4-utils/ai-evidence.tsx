import { clsLabel, money, presentModelText } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { Panel, PanelHeading } from './panel'
import { chartTheme } from '../../../lib/chartTheme'

export function AiEvidence({ run }: { run: RunResult }) {
  const source = run.interventions.free_text.source ?? 'none'
  const groups = run.interventions.free_text.groups ?? []
  const review = run.exposure_review
  const comparison = run.exposure_comparison
  const comparisonRows: Array<{ label: string; before: number; after: number; format: (value: number) => string }> = comparison ? [
    { label: 'Locations', before: comparison.without_added.locations, after: comparison.with_added.locations, format: (value) => value.toLocaleString() },
    { label: 'TIV', before: comparison.without_added.total_tiv_kes, after: comparison.with_added.total_tiv_kes, format: money },
    { label: 'Gross AAL', before: comparison.without_added.aal_kes, after: comparison.with_added.aal_kes, format: money },
    { label: 'Net AAL', before: comparison.without_added.net_aal_kes, after: comparison.with_added.net_aal_kes, format: money },
    ...run.scenarios.map((scenario) => ({
      label: `1-in-${scenario.return_period_years} gross loss`,
      before: comparison.without_added.scenarios[scenario.tier],
      after: comparison.with_added.scenarios[scenario.tier],
      format: money,
    })),
    ...run.scenarios.map((scenario) => ({
      label: `1-in-${scenario.return_period_years} net loss`,
      before: comparison.without_added.net_scenarios[scenario.tier],
      after: comparison.with_added.net_scenarios[scenario.tier],
      format: money,
    })),
  ] : []
  return <div className="space-y-4">
    <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Model contribution" title="What changed in this run" description="Separate model-backed extraction from the deterministic drainage rule." />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Exposure extraction {source === 'openai' && <span className="ml-1 text-[10px] font-normal">AI-generated</span>}</p><p className="mt-2 text-lg font-semibold">{source === 'openai' ? 'Model-backed and reviewed' : source === 'rules' ? 'Validated rules' : 'No added exposure'}</p><p className="mt-1 text-xs text-text-muted">{run.interventions.free_text.rows_added} sample rows added</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Added exposure effect · 1-in-100</p><p className="mt-2 text-lg font-semibold">{money(run.metrics.exposure_delta_1_in_100_kes)}</p><p className="mt-1 text-xs text-text-muted">Against the same model run without added rows</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Unvalidated drainage sensitivity · 1-in-100</p><p className="mt-2 text-lg font-semibold">{money(run.metrics.drainage_delta_1_in_100_kes)}</p><p className="mt-1 text-xs text-text-muted">{run.controls.apply_drainage_correction ? 'Included in this run' : 'Comparison only'} · {run.interventions.drainage.sensitivity_buildings_uplifted} locations would be uplifted</p></div>
      </div>
      <p className="mt-5 text-sm leading-6 text-text-muted">{presentModelText(run.interventions.effect)}</p>
      {review?.reviewed && <div className="mt-5 rounded-lg border border-border bg-surface p-4 text-xs">
        <p className="font-semibold">Reviewed extraction record</p>
        <p className="mt-2 text-text-muted">{review.source === 'openai' ? `OpenAI model: ${review.model ?? 'unknown'} · response: ${review.response_id ?? 'unknown'}` : 'Rules extraction · no AI model'}</p>
        <p className="mt-1 text-text-muted">Reviewed {new Date(review.reviewed_at).toLocaleString()}</p>
        <p className="mt-3 font-medium">Offer text supplied</p>
        <p className="mt-1 whitespace-pre-wrap text-text-muted">{review.input_text}</p>
      </div>}
      {comparison && <div className="mt-5 overflow-x-auto"><p className="mb-2 text-xs text-text-muted">{comparison.basis}</p><table className="min-w-137.5 w-full text-left text-xs"><thead><tr className="border-b border-border"><th className="py-2">Result</th><th className="text-right">No added exposure</th><th className="text-right">Current run</th><th className="text-right">Change</th></tr></thead><tbody>{comparisonRows.map(({ label, before, after, format }) => <tr key={label} className="border-b border-border/60"><td className="py-2">{label}</td><td className="text-right">{format(before)}</td><td className="text-right">{format(after)}</td><td className="text-right">{format(after - before)}</td></tr>)}</tbody></table></div>}
      {groups.length > 0 && <div className="mt-5 overflow-x-auto"><table className="min-w-137.5 w-full text-left text-xs"><thead><tr><th className="py-2">Reviewed group</th><th>Place</th><th className="text-right">Count</th><th className="text-right">Value each</th></tr></thead><tbody>{groups.map((group, index) => <tr key={`${group.place}-${index}`}><td className="py-2"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chartTheme.housingClasses[group.housing_class] }} />{clsLabel(group.housing_class)}</td><td>{group.place}</td><td className="text-right">{group.count}</td><td className="text-right">{money(group.tiv_each_kes)}</td></tr>)}</tbody></table></div>}
    </Panel>
    <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Underwriter note" title="Current run briefing" description="A deterministic summary of model outputs, not an AI-generated assessment." /><p className="mb-3 text-[10px] font-medium text-text-muted">Model summary</p><p className="whitespace-pre-wrap text-sm leading-7 text-text">{presentModelText(run.briefing)}</p></Panel>
  </div>
}
