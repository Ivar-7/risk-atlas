import { useState } from 'react'
import type { RunResult } from '../../features/model/types'
import { CategoryRankChart } from './dashboard-4-utils/category-rank-chart'
import { ExposureMap } from './dashboard-4-utils/exposure-map'
import { QuickActions } from './dashboard-4-utils/quick-actions'
import { RefundReturnRateChart } from './dashboard-4-utils/refund-return-rate-chart'
import { RevenueChart } from './dashboard-4-utils/revenue-chart'
import { DashboardStats } from './dashboard-4-utils/stats'
import type { Scenario } from './dashboard-4-utils/model'

export function Dashboard({ run }: { run: RunResult }) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const scenario: Scenario | undefined = run.scenarios.find((item) => item.tier === selectedTier)
    ?? run.scenarios.find((item) => item.return_period_years === 100)
    ?? run.scenarios[0]

  if (!scenario) return <p className="text-sm text-white/50">This run has no scenarios to display.</p>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStats run={run} scenario={scenario} />
      <RevenueChart run={run} scenario={scenario} />
      <RefundReturnRateChart run={run} scenario={scenario} />
      <ExposureMap run={run} scenario={scenario} />
      <CategoryRankChart run={run} scenario={scenario} />
      <QuickActions run={run} scenario={scenario} onScenarioChange={setSelectedTier} />
    </div>
  )
}

export default Dashboard
