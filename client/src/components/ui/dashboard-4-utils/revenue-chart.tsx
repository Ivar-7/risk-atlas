import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { scenarioLabel, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'
import { chartTheme } from '../../../lib/chartTheme'
import { SimulatedEpChart } from './simulated-ep-chart'

export function RevenueChart({ run, scenario, compact = false }: { run: RunResult; scenario: Scenario; compact?: boolean }) {
  const hasReinsurance = run.controls.quota_share_ceded_pct > 0 || run.controls.cat_xol_applies
  return (
    <>
    <Panel id="loss-curve" className="p-5 sm:p-6">
      <PanelHeading
        eyebrow="Financial engine"
        title={compact ? 'Loss across scenarios' : 'Illustrative loss curve'}
        description={`Ground-up, gross insured and net retained portfolio loss across ${run.scenarios.length} assumed return periods. ${run.controls.apply_drainage_correction ? 'This run includes the unvalidated drainage sensitivity.' : 'The dashed line shows the unvalidated drainage sensitivity.'}`}
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
            {hasReinsurance && <Line type="monotone" dataKey="net_loss_kes" name="Net retained loss" isAnimationActive={false} stroke={chartTheme.success} strokeWidth={2.5} dot={{ r: 4, fill: chartTheme.success }} />}
            <Line type="monotone" dataKey={run.controls.apply_drainage_correction ? 'baseline_loss_kes' : 'drainage_sensitivity_loss_kes'} name={run.controls.apply_drainage_correction ? 'Proxy-only gross comparison' : 'Unvalidated gross drainage sensitivity'} isAnimationActive={false} stroke={chartTheme.comparison} strokeDasharray="5 4" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: chartTheme.comparison, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-5 text-xs text-text-muted"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-accent" /> Gross insured</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-brand-navy" /> Ground-up</span>{hasReinsurance && <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-success" /> Net retained</span>}<span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-steel-blue" /> {run.controls.apply_drainage_correction ? 'Proxy-only gross comparison' : 'Unvalidated gross drainage sensitivity'}</span></div>
      {compact && <div className="mt-5 overflow-x-auto rounded-lg border border-border/70"><table className="w-full min-w-120 text-left text-xs"><thead className="bg-surface-alt text-text-muted"><tr><th className="px-3 py-2">Scenario</th><th className="px-3 py-2 text-right">Ground-up</th><th className="px-3 py-2 text-right">Gross insured</th><th className="px-3 py-2 text-right">Net retained</th></tr></thead><tbody>{[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <tr key={item.tier} className={`border-t border-border/70 ${item.tier === scenario.tier ? 'bg-danger-tint' : ''}`}><td className="px-3 py-2">{scenarioLabel(item)}</td><td className="px-3 py-2 text-right tabular-nums">{money(item.ground_up_loss_kes)}</td><td className="px-3 py-2 text-right tabular-nums">{money(item.loss_kes)}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{money(item.net_loss_kes)}</td></tr>)}</tbody></table></div>}
      {!compact && <><div className="mt-6 overflow-x-auto rounded-lg border border-border/70"><table className="w-full min-w-210 text-left text-xs"><thead className="bg-surface-alt text-text-muted"><tr><th className="px-3 py-2">Source tier</th><th className="px-3 py-2">Assumed period</th><th className="px-3 py-2">Annual exceedance</th><th className="px-3 py-2 text-right">Ground-up</th><th className="px-3 py-2 text-right">Gross insured</th><th className="px-3 py-2 text-right">Quota recovery</th><th className="px-3 py-2 text-right">Cat XOL recovery</th><th className="px-3 py-2 text-right">Net retained</th></tr></thead><tbody>{[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <tr key={item.tier} className="border-t border-border/70"><td className="px-3 py-2.5 capitalize">{item.tier}</td><td className="px-3 py-2.5">1-in-{item.return_period_years}</td><td className="px-3 py-2.5">{(item.annual_exceedance * 100).toFixed(1)}%</td><td className="px-3 py-2.5 text-right tabular-nums">{money(item.ground_up_loss_kes)}</td><td className="px-3 py-2.5 text-right tabular-nums">{money(item.loss_kes)}</td><td className="px-3 py-2.5 text-right tabular-nums">{money(item.quota_share_recovery_kes)}</td><td className="px-3 py-2.5 text-right tabular-nums">{money(item.cat_xol_recovery_kes)}</td><td className="px-3 py-2.5 text-right font-medium tabular-nums">{money(item.net_loss_kes)}</td></tr>)}</tbody></table></div>
      <p className="mt-2 text-xs leading-5 text-text-muted">The source “common” mask covers the widest area and is assigned the rarest event (1-in-250) so scenario losses rise with rarity. These file names and return periods are not measured event frequencies.</p></>}
      {!compact && <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">{scenarioLabel(scenario)} gross loss</p><p className="mt-2 text-xl font-semibold">{money(scenario.loss_kes)}</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">{scenarioLabel(scenario)} net retained</p><p className="mt-2 text-xl font-semibold">{money(scenario.net_loss_kes)}</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">{scenarioLabel(scenario)} ground-up loss</p><p className="mt-2 text-xl font-semibold">{money(scenario.ground_up_loss_kes)}</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Annual exceedance probability</p><p className="mt-2 text-xl font-semibold">{(scenario.annual_exceedance * 100).toFixed(1)}% <span className="text-xs font-normal text-muted-foreground">assumed</span></p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Affected sample value</p><p className="mt-2 text-xl font-semibold">{money(scenario.affected_tiv_kes)}</p><p className="mt-1 text-xs text-muted-foreground">{scenario.affected_locations} locations</p></div>
      </div>}
      {!compact && <><p className="mt-4 text-xs leading-5 text-muted-foreground">Each building uses an assumed {run.controls.deductible_pct}% TIV deductible and {run.controls.policy_limit_pct}% TIV policy limit. Quota share cedes {run.controls.quota_share_ceded_pct}% of aggregate gross loss; {run.controls.cat_xol_applies ? `cat XOL then attaches at ${money(run.controls.cat_xol_attachment_kes ?? 0)} with a ${money(run.controls.cat_xol_limit_kes ?? 0)} layer limit.` : 'no cat XOL layer is applied.'} A 1-in-{scenario.return_period_years} level means an assumed {(scenario.annual_exceedance * 100).toFixed(1)}% annual chance of exceeding this loss. The lines are illustrative because the proxy tiers have no measured frequency.</p>
      <p className="mt-3 text-[11px] leading-5 text-text-muted">The drainage uplift is constructed around the 12 proxy-missed hotspot centres. Those same centres cannot validate predictive accuracy. The starter hazard tiers have no measured event frequency.</p></>}
    </Panel>
    {!compact && <SimulatedEpChart run={run} />}
    </>
  )
}
