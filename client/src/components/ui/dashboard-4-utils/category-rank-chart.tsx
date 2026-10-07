import { clsLabel, money } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { constructionColor, scenarioLabel, scenarioLoss, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'

export function CategoryRankChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  const classes = run.by_housing_class.map((item, index) => ({
    key: item.housing_class,
    label: clsLabel(item.housing_class),
    color: constructionColor(index),
    loss: run.locations.filter((location) => location.housing_class === item.housing_class).reduce((sum, location) => sum + scenarioLoss(location, scenario.tier), 0),
    affected: run.locations.filter((location) => location.housing_class === item.housing_class && scenarioLoss(location, scenario.tier) > 0).length,
  })).sort((left, right) => right.loss - left.loss)
  const largestLoss = Math.max(...classes.map((item) => item.loss), 1)

  return (
    <Panel id="construction" className="p-5 sm:p-6">
      <PanelHeading eyebrow="Vulnerability × exposure" title="Loss by construction" description={`Modelled ${scenarioLabel(scenario)} gross loss by building class.`} />
      <div className="mt-7 space-y-6">
        {classes.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-white/75">{item.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-white">{money(item.loss)}</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full" style={{ width: `${(item.loss / largestLoss) * 100}%`, backgroundColor: item.color }} />
            </div>
            <p className="mt-1.5 text-[11px] text-white/35">{item.affected} locations with modelled loss</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
