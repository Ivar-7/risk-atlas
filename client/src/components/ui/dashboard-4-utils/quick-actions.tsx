import { Download, Info } from 'lucide-react'
import { constructionClasses, damageRatioFor, exposureRows, lossFor, scenarios, scoreFor, type ScenarioKey, type ScenarioSummary } from './model'
import { Panel, PanelHeading } from './panel'

function downloadScenario(summary: ScenarioSummary) {
  const columns = ['location_id', 'synthetic', 'housing_class', 'tiv_kes', 'proxy_tier', 'susceptibility_score', 'assumed_damage_ratio', 'gross_loss_kes']
  const lines = exposureRows.map((row) => [
    row[0],
    'true',
    constructionClasses[row[3]].key,
    row[4],
    summary.scenario.tier,
    scoreFor(row, summary.scenario).toFixed(6),
    damageRatioFor(row, summary.scenario).toFixed(6),
    Math.round(lossFor(row, summary.scenario)),
  ].join(','))
  const blob = new Blob([[columns.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `risk-atlas-${summary.scenario.key}-synthetic-loss.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function QuickActions({ summary, onScenarioChange }: { summary: ScenarioSummary; onScenarioChange: (key: ScenarioKey) => void }) {
  return (
    <Panel id="assumptions" className="p-5 sm:p-6">
      <PanelHeading eyebrow="Workspace" title="Explore a scenario" description="Switch the assumed return period to update every view." />
      <div className="mt-6 grid grid-cols-3 gap-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.key}
            type="button"
            aria-pressed={summary.scenario.key === scenario.key}
            onClick={() => onScenarioChange(scenario.key)}
            className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${summary.scenario.key === scenario.key ? 'border-emerald-200/40 bg-emerald-200/15 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.07] hover:text-white'}`}
          >
            {scenario.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => downloadScenario(summary)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-200 px-4 py-3 text-sm font-semibold text-[#0b1713] transition-colors hover:bg-emerald-100">
        <Download size={16} /> Export scenario CSV
      </button>
      <details className="group mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-4 text-xs text-white/55">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-white/80"><Info size={15} className="text-emerald-200" /> Assumptions and limits <span className="ml-auto text-white/40 group-open:rotate-45">+</span></summary>
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4 leading-5">
          <p><strong className="text-white/75">Exposure:</strong> 600 fully synthetic locations from the supplied Nairobi starter kit. No Kenya Re client portfolio is shown.</p>
          <p><strong className="text-white/75">Hazard:</strong> 0–1 susceptibility proxy derived from terrain and mapped rivers, not measured flood depth. The starter proxy flags 12 of 24 geocoded named hotspots.</p>
          <p><strong className="text-white/75">Return periods:</strong> Provisional mapping from the widest proxy mask to 1-in-100 and the narrowest to 1-in-5. The tiers have no observed event frequencies.</p>
          <p><strong className="text-white/75">Damage:</strong> Score<sup>1.2</sup> times an assumed construction cap of 75%, 60%, 45%, or 30%. These are demonstration parameters, not a calibrated depth-damage curve.</p>
          <p><strong className="text-white/75">Scope:</strong> Gross property loss before policy or reinsurance terms. No AI-enhanced model stage is connected to this view.</p>
        </div>
      </details>
      <p className="mt-4 text-[11px] leading-5 text-white/35">Illustrative decision-support prototype. Do not use these outputs for underwriting.</p>
    </Panel>
  )
}
