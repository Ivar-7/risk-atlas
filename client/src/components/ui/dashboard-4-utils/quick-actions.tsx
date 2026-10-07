import { Download, Info } from 'lucide-react'
import type { RunResult } from '../../../features/model/types'
import { downloadScenario, scenarioLabel, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'

export function QuickActions({ run, scenario, onScenarioChange }: {
  run: RunResult
  scenario: Scenario
  onScenarioChange: (tier: string) => void
}) {
  return (
    <Panel id="assumptions" className="p-5 sm:p-6">
      <PanelHeading eyebrow="Workspace" title="Explore a scenario" description="Switch the assumed return period to update every view." />
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => (
          <button
            key={item.tier}
            type="button"
            aria-pressed={scenario.tier === item.tier}
            onClick={() => onScenarioChange(item.tier)}
            className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${scenario.tier === item.tier ? 'border-emerald-200/40 bg-emerald-200/15 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.07] hover:text-white'}`}
          >
            {scenarioLabel(item)}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => downloadScenario(run, scenario)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-200 px-4 py-3 text-sm font-semibold text-[#0b1713] transition-colors hover:bg-emerald-100">
        <Download size={16} /> Export scenario CSV
      </button>
      <details className="group mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-4 text-xs text-white/55">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-white/80"><Info size={15} className="text-emerald-200" /> Data and assumptions <span className="ml-auto text-white/40 group-open:rotate-45">+</span></summary>
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4 leading-5">
          {Object.entries(run.labels).map(([key, value]) => <p key={key}><strong className="text-white/75">{key.replaceAll('_', ' ')}:</strong> {value}</p>)}
          <p><strong className="text-white/75">Selected scenario:</strong> {scenario.meaning}. Its return period is an assumption.</p>
          <p><strong className="text-white/75">Run:</strong> {run.run_id.slice(0, 8)} · {new Date(run.created_at).toLocaleString('en-KE')}</p>
        </div>
      </details>
      <p className="mt-4 text-[11px] leading-5 text-white/35">{run.disclaimer}</p>
    </Panel>
  )
}
