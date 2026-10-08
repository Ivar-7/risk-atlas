import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { scenarioLabel, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'
import { chartTheme } from '../../../lib/chartTheme'

export function RevenueChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  return (
    <Panel id="loss-curve" className="p-5 sm:p-6">
      <PanelHeading
        eyebrow="Financial engine"
        title="Illustrative loss curve"
        description={`Ground-up and gross insured loss across ${run.scenarios.length} assumed return periods. ${run.controls.apply_drainage_correction ? 'This run includes the unvalidated drainage sensitivity.' : 'The dashed line shows the unvalidated drainage sensitivity.'}`}
        action={<span className="rounded-full border border-accent/20 bg-danger-tint px-3 py-1.5 text-[11px] text-danger">{scenarioLabel(scenario)} selected</span>}
      />
      <div className="mt-7 h-65 w-full" role="img" aria-label="Ground-up and gross insured loss by assumed return period for the current run">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...run.ep_curve].sort((a, b) => a.return_period_years - b.return_period_years)} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="risk-loss-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartTheme.primary} stopOpacity={0.08} />
                <stop offset="100%" stopColor={chartTheme.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeWidth={1} />
            <XAxis dataKey="return_period_years" tickLine={false} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} tickFormatter={(value: number) => `${value}y`} dy={9} />
            <YAxis tickLine={false} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} tickFormatter={(value: number) => money(value).replace('KES ', '')} width={58} />
            <Tooltip
              cursor={{ stroke: chartTheme.primary, strokeOpacity: 0.3, strokeDasharray: '4 4' }}
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              labelFormatter={(value) => `1-in-${value} assumed return period`}
              formatter={(value, name) => [money(Number(value)), name]}
            />
            <ReferenceLine x={scenario.return_period_years} stroke={chartTheme.primary} strokeDasharray="4 5" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="loss_kes" name="Gross insured loss" isAnimationActive={false} stroke={chartTheme.primary} strokeWidth={2.5} fill="url(#risk-loss-gradient)" dot={{ r: 3, fill: chartTheme.primary, stroke: 'var(--color-surface)', strokeWidth: 2 }} activeDot={{ r: 6, fill: chartTheme.primary, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="ground_up_loss_kes" name="Ground-up loss" isAnimationActive={false} stroke={chartTheme.navy} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={run.controls.apply_drainage_correction ? 'baseline_loss_kes' : 'drainage_sensitivity_loss_kes'} name={run.controls.apply_drainage_correction ? 'Proxy-only comparison' : 'Unvalidated drainage sensitivity'} isAnimationActive={false} stroke={chartTheme.comparison} strokeDasharray="5 4" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: chartTheme.comparison, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-5 text-xs text-text-muted"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-accent" /> Gross insured</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-brand-navy" /> Ground-up</span><span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-steel-blue" /> {run.controls.apply_drainage_correction ? 'Proxy-only comparison' : 'Unvalidated drainage sensitivity'}</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">{scenarioLabel(scenario)} gross loss</p><p className="mt-2 text-xl font-semibold">{money(scenario.loss_kes)}</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">{scenarioLabel(scenario)} ground-up loss</p><p className="mt-2 text-xl font-semibold">{money(scenario.ground_up_loss_kes)}</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Annual exceedance probability</p><p className="mt-2 text-xl font-semibold">{(scenario.annual_exceedance * 100).toFixed(1)}% <span className="text-xs font-normal text-muted-foreground">assumed</span></p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Affected sample value</p><p className="mt-2 text-xl font-semibold">{money(scenario.affected_tiv_kes)}</p><p className="mt-1 text-xs text-muted-foreground">{scenario.affected_locations} locations</p></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Each building uses an assumed {run.controls.deductible_pct}% TIV deductible and {run.controls.policy_limit_pct}% TIV policy limit. A 1-in-{scenario.return_period_years} level means an assumed {(scenario.annual_exceedance * 100).toFixed(1)}% annual chance of exceeding this loss, not one event every {scenario.return_period_years} years. The line is illustrative because the proxy tiers have no measured frequency.</p>
      <p className="mt-3 text-[11px] leading-5 text-text-muted">The drainage uplift is constructed around the 12 proxy-missed hotspot centres. Those same centres cannot validate predictive accuracy. The starter hazard tiers have no measured event frequency.</p>
    </Panel>
  )
}
