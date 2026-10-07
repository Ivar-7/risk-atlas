import { constructionClasses, formatKes, type ScenarioSummary } from './model'
import { Panel, PanelHeading } from './panel'

export function CategoryRankChart({ summary }: { summary: ScenarioSummary }) {
  const classes = constructionClasses.map((item, index) => ({ ...item, loss: summary.classLosses[index], affected: summary.classAffected[index] }))
    .sort((left, right) => right.loss - left.loss)
  const largestLoss = Math.max(...classes.map((item) => item.loss), 1)

  return (
    <Panel id="construction" className="p-5 sm:p-6">
      <PanelHeading eyebrow="Vulnerability × exposure" title="Loss by construction" description={`Illustrative ${summary.scenario.label} gross loss by building class.`} />
      <div className="mt-7 space-y-6">
        {classes.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-white/75">{item.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-white">{formatKes(item.loss, 1)}</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full" style={{ width: `${(item.loss / largestLoss) * 100}%`, backgroundColor: item.color }} />
            </div>
            <p className="mt-1.5 text-[11px] text-white/35">{item.affected} locations with proxy signal</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
