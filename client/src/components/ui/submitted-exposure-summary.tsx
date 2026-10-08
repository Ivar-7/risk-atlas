import { useState } from 'react'
import { ArrowRight, Download, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RunResult } from '../../features/model/types'
import { submittedExposure } from '../../features/model/submittedExposure'
import { clsLabel, money, pct } from '../../features/model/format'
import { chartTheme } from '../../lib/chartTheme'
import { downloadScenario, scenarioLabel } from './dashboard-4-utils/model'
import { Panel, PanelHeading } from './dashboard-4-utils/panel'
import type { DashboardSectionId } from './dashboard-sidebar'
import { SummaryLocationMap } from './summary-location-map'

const fullKes = (value: number) => `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`

export function SubmittedExposureSummary({ run, onNavigate }: { run: RunResult; onNavigate: (id: DashboardSectionId) => void }) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const submitted = submittedExposure(run)
  const groups = run.exposure_review?.groups ?? run.interventions.free_text.groups ?? []
  const scenarios = [...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years)
  const scenario = scenarios.find((item) => item.tier === selectedTier) ?? scenarios.find((item) => item.return_period_years === 100) ?? scenarios[0]

  if (!submitted || !scenario) return <Panel className="p-7 sm:p-9"><PanelHeading eyebrow="Submitted exposure" title="Submitted rows are unavailable" description="This run does not contain a complete set of separately identified submitted buildings. Reopen the model workspace and run the reviewed exposure again." /><button type="button" onClick={() => onNavigate('workspace')} className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent">Open model workspace</button></Panel>

  const { locations } = submitted
  const sum = (select: (location: typeof locations[number]) => number) => locations.reduce((total, location) => total + select(location), 0)
  const loss = (tier: string) => submitted.scenarios[tier].loss_kes
  const groundUp = (tier: string) => submitted.scenarios[tier].ground_up_loss_kes
  const affected = submitted.scenarios[scenario.tier].affected_locations
  const affectedValue = submitted.scenarios[scenario.tier].affected_tiv_kes
  const loss100 = scenarios.find((item) => item.return_period_years === 100)
  const loss250 = scenarios.find((item) => item.return_period_years === 250)
  const classes = [...new Set(locations.map((location) => location.housing_class))].map((name) => ({
    name, count: locations.filter((location) => location.housing_class === name).length,
    tiv: sum((location) => location.housing_class === name ? location.tiv_kes : 0),
    loss: sum((location) => location.housing_class === name ? location.scenario_losses_kes[scenario.tier] : 0),
  })).sort((a, b) => b.loss - a.loss)
  const places = [...new Set(locations.map((location) => location.nearest_hotspot))]
  const chartData = scenarios.map((item) => ({
    tier: item.tier,
    label: `1-in-${item.return_period_years}`,
    groundUp: groundUp(item.tier),
    gross: loss(item.tier),
  }))
  const mapPoints = locations.map((location) => ({
    id: location.loc_id,
    title: clsLabel(location.housing_class),
    lat: location.lat,
    lon: location.lon,
    metrics: [
      ...(location.coordinate_source ? [{ label: 'Coordinate source', value: location.coordinate_source }] : []),
      ...(location.address ? [{ label: 'Address supplied', value: location.address }] : []),
      { label: 'TIV', value: fullKes(location.tiv_kes) },
      { label: 'Hazard score', value: location.hazard_scores[scenario.tier].toFixed(2) },
      { label: 'Damage ratio', value: pct(location.tiv_kes > 0 ? location.ground_up_scenario_losses_kes[scenario.tier] / location.tiv_kes : 0) },
      { label: 'Ground-up loss', value: fullKes(location.ground_up_scenario_losses_kes[scenario.tier]) },
      { label: 'Gross insured', value: fullKes(location.scenario_losses_kes[scenario.tier]) },
    ],
  }))
  const runTime = new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(run.created_at))

  return <div className="space-y-5">
    <section className="rounded-xl bg-brand-navy p-6 text-white shadow-dashboard sm:p-8" aria-label="Submitted exposure readout">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">Submitted exposure · illustrative</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{locations.length} added {locations.length === 1 ? 'building' : 'buildings'}</h2><p className="mt-2 text-sm text-white/75">{groups.length ? groups.map((group) => `${group.count} ${clsLabel(group.housing_class)} in ${group.place}`).join(' · ') : `Near ${places.join(', ')}`}</p><p className="mt-3 text-xs text-white/60">Run {run.run_id.slice(0, 8)} · {runTime} EAT</p></div>
        <button type="button" onClick={() => downloadScenario(run, scenario, locations, 'submitted')} className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"><Download size={15} /> Export these {locations.length} buildings</button>
      </div>
      <div className="mt-7 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-4">
        <div><p className="text-xs text-white/65">Submitted insured value</p><p className="mt-2 text-xl font-semibold tabular-nums">{money(submitted.total_tiv_kes)}</p></div>
        <div><p className="text-xs text-white/65">Submitted gross AAL</p><p className="mt-2 text-xl font-semibold tabular-nums">{money(submitted.aal_kes)}</p></div>
        <div><p className="text-xs text-white/65">1-in-100 gross loss</p><p className="mt-2 text-xl font-semibold tabular-nums">{loss100 ? money(loss(loss100.tier)) : '—'}</p></div>
        <div><p className="text-xs text-white/65">1-in-250 gross loss</p><p className="mt-2 text-xl font-semibold tabular-nums">{loss250 ? money(loss(loss250.tier)) : '—'}</p></div>
      </div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Only the submitted buildings" title="Loss by assumed scenario" description="The graph sums ground-up damage and gross insured loss for the buildings added in this run." />
        <div className="mt-5 h-72 w-full" role="img" aria-label="Ground-up and gross insured loss by assumed scenario for submitted buildings only"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke={chartTheme.grid} /><XAxis dataKey="label" tick={{ fill: chartTheme.axisLabel, fontSize: 11 }} axisLine={{ stroke: chartTheme.axis }} /><YAxis width={82} tickFormatter={(value: number) => money(value).replace('KES ', '')} tick={{ fill: chartTheme.axisLabel, fontSize: 11 }} axisLine={{ stroke: chartTheme.axis }} /><Tooltip formatter={(value, name) => [money(Number(value)), name]} contentStyle={chartTheme.tooltip.contentStyle} /><Bar dataKey="groundUp" name="Ground-up damage" fill={chartTheme.navy} radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="gross" name="Gross insured loss" fill={chartTheme.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-brand-navy" /> Ground-up damage</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Gross insured loss</span></div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Select an assumed scenario">{scenarios.map((item) => <button key={item.tier} type="button" aria-pressed={item.tier === scenario.tier} onClick={() => setSelectedTier(item.tier)} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${item.tier === scenario.tier ? 'border-accent bg-danger-tint text-accent' : 'border-border text-text-muted hover:bg-surface-alt'}`}>{scenarioLabel(item)}</button>)}</div>
        <p className="mt-4 text-xs leading-5 text-text-muted">The return periods are assigned assumptions. The gross loss applies a {run.controls.deductible_pct}% TIV deductible and {run.controls.policy_limit_pct}% TIV limit to each added building.</p>
      </Panel>
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Selected scenario" title={`${scenarioLabel(scenario)} at this exposure`} description="Choose a scenario below the graph to update these values and the map details." />
        <dl className="mt-5 divide-y divide-border/70 text-sm">
          <div className="flex justify-between gap-3 py-3"><dt>Ground-up damage</dt><dd className="font-semibold tabular-nums">{money(groundUp(scenario.tier))}</dd></div>
          <div className="flex justify-between gap-3 py-3"><dt>Gross insured loss</dt><dd className="font-semibold tabular-nums text-accent">{money(loss(scenario.tier))}</dd></div>
          <div className="flex justify-between gap-3 py-3"><dt>Affected buildings</dt><dd className="font-semibold tabular-nums">{affected}/{locations.length}</dd></div>
          <div className="flex justify-between gap-3 py-3"><dt>Affected insured value</dt><dd className="font-semibold tabular-nums">{money(affectedValue)}</dd></div>
          <div className="flex justify-between gap-3 py-3"><dt>Gross loss / affected value</dt><dd className="font-semibold tabular-nums">{affectedValue ? pct(loss(scenario.tier) / affectedValue) : '0%'}</dd></div>
        </dl>
      </Panel>
    </div>

    <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Submitted locations" title="Where the added buildings were modelled" description="Pins show only the buildings added in the model workspace, at the coordinates used by this run." />
      <SummaryLocationMap points={mapPoints} label="Interactive map of submitted building positions" />
      <p className="mt-3 text-xs leading-5 text-text-muted">{run.coordinate_review?.reviewed ? 'The pins use the reviewed coordinate schedule supplied with this offer. The API checked bounds and group values, but did not independently verify addresses.' : 'These free-text buildings were placed synthetically near named areas. The pins show exact model input coordinates, not verified building addresses.'} Click a pin for its {scenarioLabel(scenario)} hazard, damage and loss values. Any positive hazard score activates the fixed class-by-tier damage ratio; score magnitude does not change it.</p>
    </Panel>

    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Submitted schedule" title="What was modelled" description="Construction and value for the added buildings only." />
        <div className="mt-5 divide-y divide-border/70">{classes.map((item) => <div key={item.name} className="py-3 text-sm"><div className="flex justify-between gap-3"><strong>{item.count} {clsLabel(item.name)}</strong><span className="tabular-nums">{money(item.tiv)} TIV</span></div><p className="mt-1 text-xs text-text-muted">{scenarioLabel(scenario)} gross loss: {money(item.loss)}</p></div>)}</div>
        <p className="mt-4 text-xs text-text-muted">{run.coordinate_review?.reviewed ? `Coordinates supplied in ${run.coordinate_review.filename}; confirm each point against the original property schedule before underwriting.` : `Placed near ${places.join(', ')}. Upload a building coordinate schedule in the model workspace before using these positions for underwriting.`}</p>
      </Panel>
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Review before use" title="Checks for this submission" />
        <ul className="mt-5 space-y-3 text-sm leading-5">
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span>Confirm the {locations.length} buildings, construction classes, insured values and actual coordinates against the offered schedule.</span></li>
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span>Per-building deductible and limit are assumed percentages of TIV; confirm actual coverage and terms before underwriting.</span></li>
          <li className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span>Hazard scores, fixed damage tiers and return periods are illustrative. Portfolio reinsurance applies to the aggregate event and is shown in Portfolio analysis; its recovery is not allocated to these added buildings.</span></li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-xs font-semibold text-accent"><button type="button" onClick={() => onNavigate('workspace')} className="inline-flex items-center gap-1 hover:underline">Review inputs <ArrowRight size={14} /></button><button type="button" onClick={() => onNavigate('portfolio')} className="inline-flex items-center gap-1 hover:underline">View full portfolio separately <ArrowRight size={14} /></button></div>
      </Panel>
    </div>
  </div>
}
