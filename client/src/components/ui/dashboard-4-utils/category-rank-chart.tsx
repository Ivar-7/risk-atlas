import { clsLabel, money, pct } from '../../../features/model/format'
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
    tiv: item.tiv_kes,
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
            <p className="mt-1.5 text-[11px] text-white/45">{item.affected} locations with modelled loss · {money(item.tiv)} insured value · {item.tiv > 0 ? pct(item.loss / item.tiv, 1) : '0%'} scenario loss ratio</p>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-border/70 pt-6"><h3 className="text-sm font-semibold">How construction changes damage</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">JRC Africa residential shape adapted by class. Depth is derived from proxy score × 4 m, an assumption rather than observed water depth.</p><div className="mt-4 overflow-x-auto"><table className="min-w-[560px] w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-2">Class</th><th>0.5 m</th><th>1 m</th><th>2 m</th><th>4 m</th><th>Cap</th></tr></thead><tbody>{run.vulnerability_matrix.map((row) => <tr key={row.housing_class} className="border-t border-border/60"><td className="py-3 font-medium">{clsLabel(row.housing_class)}</td>{['0.5', '1.0', '2.0', '4.0'].map((depth) => <td key={depth}>{pct(row.by_depth_m[depth], 0)}</td>)}<td>{pct(row.cap, 0)}</td></tr>)}</tbody></table></div><div className="mt-3 space-y-1">{run.vulnerability_matrix.map((row) => <p key={row.housing_class} className="text-xs leading-5 text-muted-foreground"><strong className="font-medium text-foreground">{clsLabel(row.housing_class)}:</strong> {row.differs_from_jrc}</p>)}</div></div>
    </Panel>
  )
}
