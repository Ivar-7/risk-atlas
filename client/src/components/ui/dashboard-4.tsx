import { useState } from 'react'
import type { RunResult } from '../../features/model/types'
import { clsLabel, money } from '../../features/model/format'
import type { DashboardSectionId } from './dashboard-sidebar'
import { CategoryRankChart } from './dashboard-4-utils/category-rank-chart'
import { AiEvidence } from './dashboard-4-utils/ai-evidence'
import { ExposureMap } from './dashboard-4-utils/exposure-map'
import { QuickActions } from './dashboard-4-utils/quick-actions'
import { RefundReturnRateChart } from './dashboard-4-utils/refund-return-rate-chart'
import { RevenueChart } from './dashboard-4-utils/revenue-chart'
import { DashboardStats } from './dashboard-4-utils/stats'
import { scenarioLabel, type Scenario } from './dashboard-4-utils/model'
import { Panel, PanelHeading } from './dashboard-4-utils/panel'

export function Dashboard({ run, activeSection }: { run: RunResult; activeSection: DashboardSectionId }) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const scenario: Scenario | undefined = run.scenarios.find((item) => item.tier === selectedTier)
    ?? run.scenarios.find((item) => item.return_period_years === 100)
    ?? run.scenarios[0]

  if (!scenario) return <p className="text-sm text-muted-foreground">This run has no scenarios to display.</p>

  return <div aria-label={`${activeSection.replaceAll('-', ' ')} tab`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/75">Active scenario</p><p className="mt-1 text-sm text-muted-foreground">{scenarioLabel(scenario)}</p></div>
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">Return period
        <select value={scenario.tier} onChange={(event) => setSelectedTier(event.target.value)} className="rounded-md border border-input-border bg-surface px-3 py-2 text-sm font-medium text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <option key={item.tier} value={item.tier}>{scenarioLabel(item)}</option>)}
        </select>
      </label>
    </div>

    {activeSection === 'overview' && <div className="space-y-4">
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Underwriter snapshot" title="What this run says" description="Illustrative ground-up and gross insured loss from synthetic exposure and an uncalibrated pluvial proxy." /><p className="mt-4 text-sm leading-7 text-foreground/75">At the assumed 1-in-100 level, ground-up loss is <strong className="text-foreground">{money(run.metrics.ground_up_loss_1_in_100_kes)}</strong> and gross insured loss is <strong className="text-foreground">{money(run.metrics.loss_1_in_100_kes)}</strong>. The assumed 1-in-250 gross insured loss is <strong className="text-foreground">{money(run.metrics.loss_1_in_250_kes)}</strong>. Terms are assumed for every synthetic property: {run.controls.deductible_pct}% TIV deductible and {run.controls.policy_limit_pct}% TIV limit. The common proxy detects <strong className="text-foreground">{run.hazard_validation.detected_common} of {run.hazard_validation.checked}</strong> geocoded named hotspot centres.</p><p className="mt-3 text-xs leading-5 text-text-muted">Drainage sensitivity: {run.controls.apply_drainage_correction ? 'included in this run' : 'comparison only'}. Its {money(run.metrics.drainage_delta_1_in_100_kes)} 1-in-100 uplift is unvalidated; the hotspot centres used to construct it cannot verify accuracy.</p></Panel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStats run={run} scenario={scenario} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Financial engine" title="Scenario losses" description="Ground-up damage and gross insured payout by assumed return period." /><div className="mt-5 space-y-1">{[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <div key={item.tier} className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm ${item.tier === scenario.tier ? 'bg-primary/10 text-primary' : 'text-foreground/70'}`}><span>{scenarioLabel(item)}</span><span className="text-right tabular-nums"><strong className="block font-medium">{money(item.loss_kes)} gross</strong><span className="text-xs text-muted-foreground">{money(item.ground_up_loss_kes)} ground-up</span></span></div>)}</div></Panel>
        <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Portfolio" title="Largest location AALs" description="Highest annual average loss locations in this run." /><div className="mt-5 space-y-1">{run.top_locations.slice(0, 5).map((location) => <div key={location.loc_id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm text-foreground/70"><div className="min-w-0"><p className="truncate font-medium text-foreground">{location.loc_id}</p><p className="truncate text-xs text-muted-foreground">{clsLabel(location.housing_class)}</p></div><strong className="shrink-0 tabular-nums font-medium">{money(location.aal_kes)}</strong></div>)}</div></Panel>
      </div>
    </div>}
    {activeSection === 'loss-curve' && <RevenueChart run={run} scenario={scenario} />}
    {activeSection === 'hazard-proxy' && <RefundReturnRateChart run={run} scenario={scenario} />}
    {activeSection === 'exposure-map' && <ExposureMap run={run} scenario={scenario} />}
    {activeSection === 'construction' && <CategoryRankChart run={run} scenario={scenario} />}
    {activeSection === 'ai-evidence' && <AiEvidence run={run} />}
    {activeSection === 'assumptions' && <QuickActions run={run} scenario={scenario} />}
  </div>
}

export default Dashboard
