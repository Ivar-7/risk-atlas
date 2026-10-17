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
      <VulnerabilityChart matrix={run.vulnerability_matrix} scenarios={run.scenarios} />
      <div className="mt-8 border-t border-border pt-6"><h3 className="text-sm font-semibold">The five-tier damage matrix</h3><p className="mt-1 text-xs leading-5 text-text-muted">A positive score in a source tier selects its fixed construction-class ratio; zero selects 0%. Ground-up loss is that ratio multiplied by building TIV. The ratios are illustrative assumptions informed by the <a className="underline" href="https://publications.jrc.ec.europa.eu/repository/bitstream/JRC105688/global_flood_depth-damage_functions__10042017.pdf#page=16" target="_blank" rel="noreferrer">JRC Africa residential reference</a>, not JRC values for these four construction classes.</p><div className="mt-4 overflow-x-auto"><table className="min-w-140 w-full text-left text-xs"><thead className="sticky top-0 bg-surface-alt text-[10px] font-semibold uppercase tracking-wide text-text-muted"><tr><th className="py-2">Class</th>{[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <th key={item.tier} className="text-right">{item.tier}<span className="block normal-case tracking-normal">{item.return_period_years}y assumed</span></th>)}</tr></thead><tbody>{run.vulnerability_matrix.map((row) => <tr key={row.housing_class} className="border-t border-border transition-colors hover:bg-bg"><td className="py-3 font-medium"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chartTheme.housingClasses[row.housing_class] }} />{clsLabel(row.housing_class)}</td>{[...run.scenarios].sort((a, b) => a.return_period_years - b.return_period_years).map((item) => <td key={item.tier} className="py-3 text-right">{pct(row.by_tier[item.tier], 0)}</td>)}</tr>)}</tbody></table></div><div className="mt-3 space-y-1">{run.vulnerability_matrix.map((row) => <p key={row.housing_class} className="text-xs leading-5 text-text-muted"><strong className="font-medium text-text">{clsLabel(row.housing_class)}:</strong> {row.differs_from_jrc}</p>)}</div></div>
    </Panel>
  )
}
