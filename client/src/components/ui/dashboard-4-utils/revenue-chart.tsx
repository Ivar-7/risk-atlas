import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { scenarioLabel, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'

export function RevenueChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  return (
    <Panel id="loss-curve" className="p-5 sm:col-span-2 sm:p-6">
      <PanelHeading
        eyebrow="Financial engine"
        title="Illustrative loss curve"
        description={`Estimated gross loss for the current portfolio across ${run.scenarios.length} assumed return periods.`}
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
              formatter={(value) => [money(Number(value)), 'Gross loss']}
            />
            <ReferenceLine x={scenario.return_period_years} stroke="#a7f3d0" strokeDasharray="4 5" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="loss_kes" isAnimationActive={false} stroke="#a7f3d0" strokeWidth={2.5} fill="url(#risk-loss-gradient)" dot={{ r: 3, fill: '#a7f3d0', stroke: '#172126', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-white/35">The starter hazard tiers have no measured event frequency. This curve uses a provisional mapping from proxy mask width to return period.</p>
    </Panel>
  )
}
