import { clsLabel, money, pct } from '../../../features/model/format'
import type { RunResult } from '../../../features/model/types'
import { constructionColor, scenarioLabel, scenarioLoss, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'
import { chartTheme } from '../../../lib/chartTheme'
import { VulnerabilityChart } from './vulnerability-chart'

export function CategoryRankChart({ run, scenario }: { run: RunResult; scenario: Scenario }) {
  const classes = run.by_housing_class.map((item) => ({
    key: item.housing_class,
    label: clsLabel(item.housing_class),
    color: constructionColor(item.housing_class),
    loss: run.locations.filter((location) => location.housing_class === item.housing_class).reduce((sum, location) => sum + scenarioLoss(location, scenario.tier), 0),
    groundUpLoss: run.locations.filter((location) => location.housing_class === item.housing_class).reduce((sum, location) => sum + location.ground_up_scenario_losses_kes[scenario.tier], 0),
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
              <span className="flex items-center gap-2 text-text"><span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
              <span className="shrink-0 text-right font-medium tabular-nums text-text">{money(item.loss)} gross<span className="block text-[11px] font-normal text-text-muted">{money(item.groundUpLoss)} ground-up</span></span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-alt">
              <div className="h-full rounded-full" style={{ width: `${(item.loss / largestLoss) * 100}%`, backgroundColor: item.color }} />
            </div>
            <p className="mt-1.5 text-[11px] text-text-muted">{item.affected} locations with modelled loss · {money(item.tiv)} insured value · {item.tiv > 0 ? pct(item.loss / item.tiv, 1) : '0%'} scenario loss ratio</p>
          </div>
        ))}
      </div>
      <VulnerabilityChart matrix={run.vulnerability_matrix} />
      <div className="mt-8 border-t border-border pt-6"><h3 className="text-sm font-semibold">How construction changes damage</h3><p className="mt-1 text-xs leading-5 text-text-muted">The <a className="underline" href="https://publications.jrc.ec.europa.eu/repository/bitstream/JRC105688/global_flood_depth-damage_functions__10042017.pdf#page=16" target="_blank" rel="noreferrer">JRC Africa residential curve, Table 3-1</a>, gives 22% at 0.5 m and 38% at 1 m. Values between published depths use linear interpolation. Proxy score × 4 m supplies illustrative depth, not observed water depth.</p><p className="mt-1 text-xs leading-5 text-text-muted">Each class's effective-depth multiplier and damage cap are assumed adaptations, not JRC or Kenya claims values.</p><div className="mt-4 overflow-x-auto"><table className="min-w-140 w-full text-left text-xs"><thead className="sticky top-0 bg-surface-alt text-[10px] font-semibold uppercase tracking-wide text-text-muted"><tr><th className="py-2">Class</th><th>0.5 m</th><th>1 m</th><th>2 m</th><th>4 m</th><th>Assumed depth ×</th><th>Assumed cap</th></tr></thead><tbody>{run.vulnerability_matrix.map((row) => <tr key={row.housing_class} className="border-t border-border transition-colors hover:bg-bg"><td className="py-3 font-medium"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chartTheme.housingClasses[row.housing_class] }} />{clsLabel(row.housing_class)}</td>{['0.5', '1.0', '2.0', '4.0'].map((depth) => <td key={depth}>{pct(row.by_depth_m[depth], 0)}</td>)}<td>{row.depth_multiplier.toFixed(2)}×</td><td>{pct(row.cap, 0)}</td></tr>)}</tbody></table></div><div className="mt-3 space-y-1">{run.vulnerability_matrix.map((row) => <p key={row.housing_class} className="text-xs leading-5 text-text-muted"><strong className="font-medium text-text">{clsLabel(row.housing_class)}:</strong> {row.differs_from_jrc}</p>)}</div></div>
    </Panel>
  )
}
