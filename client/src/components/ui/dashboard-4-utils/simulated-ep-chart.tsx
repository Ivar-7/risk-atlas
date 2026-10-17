import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { Panel, PanelHeading } from './panel'
import { chartTheme } from '../../../lib/chartTheme'

export function SimulatedEpChart({ run }: { run: RunResult }) {
  const anchors = new Map(run.scenarios.map((scenario) => [scenario.return_period_years, scenario.loss_kes]))
  const points = run.simulated_ep.points.map((point) => ({
    ...point,
    band: [point.p05_kes, point.p95_kes],
    anchor_loss_kes: anchors.get(point.return_period_years),
  }))
  const loss500 = points.find((point) => point.return_period_years === 500)
  return <Panel className="mt-5 p-5 sm:p-6" aria-label="Conditional simulated exceedance probability curve">
    <PanelHeading eyebrow="Conditional simulation" title="10,000-year simulated loss curve" description="Gross annual maximum losses sampled from the five assumed scenario points. The shaded band shows finite-sample bootstrap variation only." action={<span className="rounded-full border border-warning/30 bg-warning-tint px-3 py-1.5 text-[11px] font-semibold text-warning">Assumption-driven · not calibrated</span>} />
    <div className="mt-5 h-72 w-full" role="img" aria-label="Conditional simulated gross loss by return period with a 5th to 95th percentile bootstrap band">
      <ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
        <CartesianGrid vertical={false} stroke={chartTheme.grid} />
        <XAxis type="number" dataKey="return_period_years" scale="log" domain={[10, 10000]} ticks={[10, 100, 1000, 10000]} tickFormatter={(value: number) => `${value}y`} tick={{ fill: chartTheme.axisLabel, fontSize: 11 }} />
        <YAxis width={74} tickFormatter={(value: number) => money(value).replace('KES ', '')} tick={{ fill: chartTheme.axisLabel, fontSize: 11 }} />
        <Tooltip labelFormatter={(value) => `1-in-${value} assumed years`} formatter={(value, name) => [Array.isArray(value) ? `${money(Number(value[0]))}–${money(Number(value[1]))}` : money(Number(value)), name]} contentStyle={chartTheme.tooltip.contentStyle} />
        <Area dataKey="band" name="Bootstrap 5th–95th" stroke="none" fill={chartTheme.comparison} fillOpacity={0.25} isAnimationActive={false} />
        <Line type="monotone" dataKey="simulated_loss_kes" name="Simulated gross loss" stroke={chartTheme.success} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        <Line dataKey="anchor_loss_kes" name="Five modelled scenario losses" stroke="none" dot={{ r: 5, fill: chartTheme.primary }} isAnimationActive={false} />
      </ComposedChart></ResponsiveContainer>
    </div>
    <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted"><span>Green: simulated annual-loss quantile</span><span>Shading: 5th–95th bootstrap interval</span><span>Red points: five modelled scenario losses</span></div>
    {loss500 && <p className="mt-4 text-sm font-medium">Illustrative 1-in-500 gross loss: {money(loss500.simulated_loss_kes)} <span className="text-xs font-normal text-text-muted">(sampling band {money(loss500.p05_kes)}–{money(loss500.p95_kes)})</span></p>}
    <p className="mt-3 text-xs leading-5 text-text-muted">{run.simulated_ep.method} {run.simulated_ep.tail_assumption} {run.simulated_ep.uncertainty_meaning} This band excludes uncertainty in actual flood frequency, hazard, vulnerability and exposure positions. Do not use the extrapolated 1-in-500 or rarer values as a priced return-period estimate.</p>
  </Panel>
}
