import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { scenarioLabel, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'

export function RevenueChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  return (
    <Panel id="loss-curve" className="p-5 sm:p-6">
      <PanelHeading
        eyebrow="Financial engine"
        title="Illustrative loss curve"
        description={`Estimated ground-up loss across ${run.scenarios.length} assumed return periods, with the uncorrected proxy as a comparison.`}
        action={<span className="rounded-full border border-emerald-200/20 bg-emerald-200/[0.07] px-3 py-1.5 text-[11px] text-emerald-100">{scenarioLabel(scenario)} selected</span>}
      />
      <div className="mt-7 h-[260px] w-full" role="img" aria-label="Modelled gross loss by assumed return period for the current backend run">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...run.ep_curve].sort((a, b) => a.return_period_years - b.return_period_years)} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="risk-loss-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="return_period_years" tickLine={false} axisLine={false} tick={{ fill: '#82908d', fontSize: 11 }} tickFormatter={(value: number) => `${value}y`} dy={9} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#82908d', fontSize: 11 }} tickFormatter={(value: number) => money(value).replace('KES ', '')} width={58} />
            <Tooltip
              cursor={{ stroke: 'rgba(167,243,208,0.35)', strokeDasharray: '4 4' }}
              contentStyle={{ background: '#172126', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, color: '#fff' }}
              labelStyle={{ color: '#d1fae5', marginBottom: 4 }}
              labelFormatter={(value) => `1-in-${value} assumed return period`}
              formatter={(value, name) => [money(Number(value)), name]}
            />
            <ReferenceLine x={scenario.return_period_years} stroke="#a7f3d0" strokeDasharray="4 5" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="loss_kes" name="Current run" isAnimationActive={false} stroke="#a7f3d0" strokeWidth={2.5} fill="url(#risk-loss-gradient)" dot={{ r: 3, fill: '#a7f3d0', stroke: '#172126', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="baseline_loss_kes" name="No drainage rule" isAnimationActive={false} stroke="#67e8f9" strokeDasharray="5 4" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-emerald-200" /> Current run</span><span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-cyan-300" /> Without drainage rule</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">{scenarioLabel(scenario)} gross loss</p><p className="mt-2 text-xl font-semibold">{money(scenario.loss_kes)}</p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Annual exceedance probability</p><p className="mt-2 text-xl font-semibold">{(scenario.annual_exceedance * 100).toFixed(1)}% <span className="text-xs font-normal text-muted-foreground">assumed</span></p></div>
        <div className="rounded-lg border border-border/70 p-4"><p className="text-xs text-muted-foreground">Affected synthetic value</p><p className="mt-2 text-xl font-semibold">{money(scenario.affected_tiv_kes)}</p><p className="mt-1 text-xs text-muted-foreground">{scenario.affected_locations} locations</p></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">A 1-in-{scenario.return_period_years} level means an assumed {(scenario.annual_exceedance * 100).toFixed(1)}% annual chance of exceeding this loss, not one event every {scenario.return_period_years} years. The line is illustrative because the proxy tiers have no measured frequency.</p>
      <p className="mt-3 text-[11px] leading-5 text-white/35">The starter hazard tiers have no measured event frequency. This curve uses a provisional mapping from proxy mask width to return period.</p>
    </Panel>
  )
}
