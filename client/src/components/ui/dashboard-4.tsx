import { useState } from 'react'
import { ArrowRight, Download, ShieldAlert } from 'lucide-react'
import type { RunResult } from '../../features/model/types'
import { clsLabel, money, pct } from '../../features/model/format'
import type { DashboardSectionId } from './dashboard-sidebar'
import { CategoryRankChart } from './dashboard-4-utils/category-rank-chart'
import { AiEvidence } from './dashboard-4-utils/ai-evidence'
import { ExposureMap } from './dashboard-4-utils/exposure-map'
import { QuickActions } from './dashboard-4-utils/quick-actions'
import { RefundReturnRateChart } from './dashboard-4-utils/refund-return-rate-chart'
import { RevenueChart } from './dashboard-4-utils/revenue-chart'
import { VulnerabilityChart } from './dashboard-4-utils/vulnerability-chart'
import { DashboardStats } from './dashboard-4-utils/stats'
import { downloadScenario, scenarioLabel, type Scenario } from './dashboard-4-utils/model'
import { Panel, PanelHeading } from './dashboard-4-utils/panel'

function PortfolioSummary({ run, scenario, onNavigate }: { run: RunResult; scenario: Scenario; onNavigate: (id: DashboardSectionId) => void }) {
  const leadingClasses = run.by_housing_class.map((item) => ({
    ...item,
    loss: run.locations.filter((location) => location.housing_class === item.housing_class)
      .reduce((sum, location) => sum + location.scenario_losses_kes[scenario.tier], 0),
  })).sort((a, b) => b.loss - a.loss).slice(0, 3)
  const leadingHotspots = [...run.by_hotspot].sort((a, b) => b.aal_kes - a.aal_kes).slice(0, 3)
  const missedHotspots = run.hazard_validation.missed_common
  const added = run.interventions.free_text.rows_added
  const addedAal = run.exposure_comparison
    ? run.exposure_comparison.with_added.aal_kes - run.exposure_comparison.without_added.aal_kes : null
  const runTime = new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(run.created_at))

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-xl border border-brand-navy/15 bg-brand-navy p-6 text-white shadow-dashboard sm:p-8" aria-label="Portfolio readout">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">Portfolio readout · illustrative</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Portfolio loss at a glance</h2><p className="mt-3 text-sm leading-6 text-white/75">Synthetic Nairobi exposure under a proxy flood model. Use the figures to review concentration and assumptions; the run does not establish a price or acceptance decision.</p><p className="mt-3 text-xs text-white/60">Run {run.run_id.slice(0, 8)} · {runTime} EAT</p></div>
        <button type="button" onClick={() => downloadScenario(run, scenario)} className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"><Download size={15} /> Export selected scenario</button>
      </div>
      <div className="mt-7 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-3">
        <div><p className="text-xs text-white/65">Gross insured AAL</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(run.metrics.aal_kes)}</p><p className="mt-1 text-xs text-white/60">From assumed event frequencies</p></div>
        <div><p className="text-xs text-white/65">Net retained AAL</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(run.metrics.net_aal_kes)}</p><p className="mt-1 text-xs text-white/60">After assumed reinsurance</p></div>
        <div><p className="text-xs text-white/65">1-in-100 gross loss</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(run.metrics.loss_1_in_100_kes)}</p><p className="mt-1 text-xs text-white/60">After assumed property terms</p></div>
        <div><p className="text-xs text-white/65">1-in-100 net loss</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(run.metrics.net_loss_1_in_100_kes)}</p><p className="mt-1 text-xs text-white/60">After quota share and cat XOL</p></div>
        <div><p className="text-xs text-white/65">1-in-250 gross loss</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(run.metrics.loss_1_in_250_kes)}</p><p className="mt-1 text-xs text-white/60">Rarest assigned scenario</p></div>
        <div><p className="text-xs text-white/65">1-in-250 net loss</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(run.metrics.net_loss_1_in_250_kes)}</p><p className="mt-1 text-xs text-white/60">Rarest assigned scenario</p></div>
      </div>
    </section>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStats run={run} scenario={scenario} /></div>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
      <RevenueChart run={run} scenario={scenario} compact />
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Selected scenario" title={`${scenarioLabel(scenario)} financial waterfall`} description="Property terms determine gross loss; portfolio treaty terms determine net retained loss." />
        <dl className="mt-5 divide-y divide-border/70 text-sm">
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Ground-up damage</dt><dd className="font-semibold tabular-nums">{money(scenario.ground_up_loss_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Gross insured loss</dt><dd className="font-semibold tabular-nums text-accent">{money(scenario.loss_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Quota share recovery</dt><dd className="font-semibold tabular-nums">−{money(scenario.quota_share_recovery_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Retained before cat XOL</dt><dd className="font-semibold tabular-nums">{money(scenario.retained_before_cat_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Cat XOL recovery</dt><dd className="font-semibold tabular-nums">−{money(scenario.cat_xol_recovery_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Net retained loss</dt><dd className="font-semibold tabular-nums text-success">{money(scenario.net_loss_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Affected insured value</dt><dd className="font-semibold tabular-nums">{money(scenario.affected_tiv_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Loss / affected value</dt><dd className="font-semibold tabular-nums">{scenario.affected_tiv_kes > 0 ? pct(scenario.loss_kes / scenario.affected_tiv_kes, 1) : '0%'}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-text-muted">Annual exceedance</dt><dd className="font-semibold tabular-nums">{pct(scenario.annual_exceedance, 1)} assumed</dd></div>
        </dl>
        <button type="button" onClick={() => onNavigate('loss-curve')} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">Full scenario table <ArrowRight size={14} /></button>
      </Panel>
    </div>

    <VulnerabilityChart matrix={run.vulnerability_matrix} scenarios={run.scenarios} />

    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Concentration" title="Where loss sits" description={`Largest contributors to ${scenarioLabel(scenario)} gross loss and annual average loss.`} />
        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">Construction · selected scenario</h3>
        <div className="mt-2 divide-y divide-border/70">{leadingClasses.map((item) => <div key={item.housing_class} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span>{clsLabel(item.housing_class)}</span><strong className="tabular-nums">{money(item.loss)}</strong></div>)}</div>
        <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-muted">Nearest named areas · AAL</h3>
        <div className="mt-2 divide-y divide-border/70">{leadingHotspots.map((item) => <div key={item.area} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate">{item.area}</span><strong className="tabular-nums">{money(item.aal_kes)}</strong></div>)}</div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-accent"><button type="button" onClick={() => onNavigate('exposure-map')} className="hover:underline">Explore locations →</button><button type="button" onClick={() => onNavigate('construction')} className="hover:underline">Construction detail →</button></div>
      </Panel>
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Review before use" title="Terms, data and model checks" description="Items an underwriter should resolve before relying on this run." />
        <ul className="mt-5 space-y-3 text-sm leading-5">
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span><strong>Exposure:</strong> {run.metrics.locations.toLocaleString('en-KE')} sample locations; {run.metrics.synthetic_locations.toLocaleString('en-KE')} synthetic. Confirm actual schedule, sums insured and coordinates.</span></li>
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span><strong>Coverage and treaty:</strong> {run.controls.deductible_pct}% TIV deductible, {run.controls.policy_limit_pct}% TIV limit, {run.controls.quota_share_ceded_pct}% quota share and {run.controls.cat_xol_applies ? 'a cat XOL layer' : 'no cat XOL layer'} are assumptions. Confirm policy wording and treaty terms.</span></li>
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span><strong>Hazard:</strong> proxy detected {run.hazard_validation.detected_common}/{run.hazard_validation.checked} geocoded named hotspot centres; {missedHotspots} were missed. Check local flood evidence and drainage.</span></li>
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span><strong>Frequency and damage:</strong> return periods and fixed class-by-tier damage ratios are assumed, so AAL and the curve are illustrative.</span></li>
        </ul>
        <p className="mt-5 rounded-lg bg-surface-alt p-3 text-xs leading-5 text-text-muted">Drainage sensitivity {run.controls.apply_drainage_correction ? 'is included' : 'is shown as a comparison'} in this run; its 1-in-100 gross uplift is {money(run.metrics.drainage_delta_1_in_100_kes)}. It is unvalidated.</p>
        <button type="button" onClick={() => onNavigate('assumptions')} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">Review model assumptions <ArrowRight size={14} /></button>
      </Panel>
    </div>

    {added > 0 && <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Change in this run" title="Reviewed exposure contribution" description={`${added} synthetic buildings added from ${run.exposure_review?.source ?? 'the workspace'} extraction.`} /><p className="mt-4 text-sm">{addedAal === null ? 'Review the added exposure evidence for its effect on this run.' : `Added gross insured AAL: ${money(addedAal)} versus the same portfolio without the added rows.`}</p><button type="button" onClick={() => onNavigate('ai-evidence')} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">View extraction and comparison <ArrowRight size={14} /></button></Panel>}
  </div>
}

export function Dashboard({ run, activeSection, onNavigate }: { run: RunResult; activeSection: DashboardSectionId; onNavigate: (id: DashboardSectionId) => void }) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const scenario: Scenario | undefined = run.scenarios.find((item) => item.tier === selectedTier)
    ?? run.scenarios.find((item) => item.return_period_years === 100)
    ?? run.scenarios[0]

  if (!scenario) return <p className="text-sm text-muted-foreground">This run has no scenarios to display.</p>

  return <div aria-label={`${activeSection.replaceAll('-', ' ')} tab`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/75">Scenario focus</p><p className="mt-1 text-sm text-muted-foreground">Explore how this run changes across assumed return periods.</p></div>
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">Return period
        <select value={scenario.tier} onChange={(event) => setSelectedTier(event.target.value)} className="rounded-md border border-input-border bg-surface px-3 py-2 text-sm font-medium text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <option key={item.tier} value={item.tier}>{scenarioLabel(item)}</option>)}
        </select>
      </label>
    </div>

    {activeSection === 'portfolio' && <PortfolioSummary run={run} scenario={scenario} onNavigate={onNavigate} />}
    {activeSection === 'loss-curve' && <RevenueChart run={run} scenario={scenario} />}
    {activeSection === 'hazard-proxy' && <RefundReturnRateChart run={run} scenario={scenario} />}
    {activeSection === 'exposure-map' && <ExposureMap run={run} scenario={scenario} />}
    {activeSection === 'construction' && <CategoryRankChart run={run} scenario={scenario} />}
    {activeSection === 'ai-evidence' && <AiEvidence run={run} />}
    {activeSection === 'assumptions' && <QuickActions run={run} scenario={scenario} />}
  </div>
}

export default Dashboard
