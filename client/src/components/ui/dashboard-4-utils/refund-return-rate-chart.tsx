import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { scenarioSummaries, scenarios, type ScenarioSummary } from './model'
import { Panel, PanelHeading } from './panel'

const maskData = [...scenarios].reverse().map((scenario) => ({
  key: scenario.key,
  tier: scenario.tier,
  locations: scenarioSummaries[scenario.key].affectedCount,
}))

export function RefundReturnRateChart({ summary }: { summary: ScenarioSummary }) {
  return (
    <Panel id="hazard-proxy" className="p-5 sm:col-span-2 sm:p-6">
      <PanelHeading eyebrow="Hazard" title="Proxy mask reach" description="Synthetic locations with a non-zero susceptibility score at each source tier." />
      <div className="mt-7 h-[260px] w-full" role="img" aria-label="Counts of locations flagged by each of the five Nairobi hazard proxy tiers">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={maskData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="tier" tickLine={false} axisLine={false} tick={{ fill: '#82908d', fontSize: 10 }} dy={9} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#82908d', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ background: '#172126', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, color: '#fff' }}
              labelStyle={{ color: '#d1fae5', marginBottom: 4 }}
              formatter={(value) => [`${value} locations`, 'Proxy signal']}
            />
            <Bar dataKey="locations" isAnimationActive={false} radius={[5, 5, 0, 0]} maxBarSize={54}>
              {maskData.map((entry) => <Cell key={entry.key} fill={entry.key === summary.scenario.key ? '#a7f3d0' : '#3e696b'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-white/35">These scores describe relative susceptibility, not observed flood water depth.</p>
    </Panel>
  )
}
