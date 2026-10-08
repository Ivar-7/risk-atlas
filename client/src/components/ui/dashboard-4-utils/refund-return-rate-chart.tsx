import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RunResult } from '../../../features/model/types'
import type { Scenario } from './model'
import { Panel, PanelHeading } from './panel'
import { chartTheme } from '../../../lib/chartTheme'

export function RefundReturnRateChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  const maskData = [...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years)
  return (
    <Panel id="hazard-proxy" className="p-5 sm:p-6">
      <PanelHeading eyebrow="Hazard" title="Modelled damage reach" description="Locations with ground-up damage at each source proxy tier, before deductibles." />
      <div className="mt-7 h-65 w-full" role="img" aria-label="Counts of locations with ground-up damage by source proxy tier">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={maskData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeWidth={1} />
            <XAxis dataKey="tier" tickLine={false} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} dy={9} />
            <YAxis tickLine={false} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: chartTheme.cursor }}
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              formatter={(value) => [`${value} locations`, 'Ground-up damage']}
            />
            <Bar dataKey="affected_locations" isAnimationActive={false} radius={[5, 5, 0, 0]} maxBarSize={54}>
              {maskData.map((entry) => <Cell key={entry.tier} fill={entry.tier === scenario.tier ? chartTheme.primary : chartTheme.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Common raster detects</p><p className="mt-2 text-xl font-semibold">{run.hazard_validation.detected_common} / {run.hazard_validation.checked}</p><p className="mt-1 text-xs text-muted-foreground">Approximate named hotspot centres</p></div><div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Named areas without coordinates</p><p className="mt-2 text-xl font-semibold">{run.hazard_validation.county_named - run.hazard_validation.checked}</p><p className="mt-1 text-xs text-muted-foreground">Not included in this point check</p></div><div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Selected tier</p><p className="mt-2 text-xl font-semibold capitalize">{scenario.tier}</p><p className="mt-1 text-xs text-muted-foreground">Assigned 1-in-{scenario.return_period_years}; frequency assumed</p></div></div>
      <p className="mt-3 text-[11px] leading-5 text-text-muted">These scores describe relative susceptibility, not observed flood water depth.</p>
    </Panel>
  )
}
