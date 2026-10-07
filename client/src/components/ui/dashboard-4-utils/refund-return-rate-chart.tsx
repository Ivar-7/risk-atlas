import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RunResult } from '../../../features/model/types'
import type { Scenario } from './model'
import { Panel, PanelHeading } from './panel'

export function RefundReturnRateChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  const maskData = [...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years)
  return (
    <Panel id="hazard-proxy" className="p-5 sm:col-span-2 sm:p-6">
      <PanelHeading eyebrow="Hazard" title="Modelled loss reach" description="Locations with modelled loss at each source proxy tier in this run." />
      <div className="mt-7 h-[260px] w-full" role="img" aria-label="Counts of locations with modelled loss by source proxy tier">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={maskData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="tier" tickLine={false} axisLine={false} tick={{ fill: '#82908d', fontSize: 10 }} dy={9} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#82908d', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ background: '#172126', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, color: '#fff' }}
              labelStyle={{ color: '#d1fae5', marginBottom: 4 }}
              formatter={(value) => [`${value} locations`, 'Modelled loss']}
            />
            <Bar dataKey="affected_locations" isAnimationActive={false} radius={[5, 5, 0, 0]} maxBarSize={54}>
              {maskData.map((entry) => <Cell key={entry.tier} fill={entry.tier === scenario.tier ? '#a7f3d0' : '#3e696b'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-white/35">These scores describe relative susceptibility, not observed flood water depth.</p>
    </Panel>
  )
}
