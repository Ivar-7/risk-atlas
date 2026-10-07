import { useState } from 'react'
import { CategoryRankChart } from './dashboard-4-utils/category-rank-chart'
import { ExposureMap } from './dashboard-4-utils/exposure-map'
import { QuickActions } from './dashboard-4-utils/quick-actions'
import { RefundReturnRateChart } from './dashboard-4-utils/refund-return-rate-chart'
import { RevenueChart } from './dashboard-4-utils/revenue-chart'
import { DashboardStats } from './dashboard-4-utils/stats'
import { scenarioSummaries, type ScenarioKey } from './dashboard-4-utils/model'

export function Dashboard() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('rp100')
  const summary = scenarioSummaries[scenarioKey]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStats summary={summary} />
      <RevenueChart summary={summary} />
      <RefundReturnRateChart summary={summary} />
      <ExposureMap summary={summary} />
      <CategoryRankChart summary={summary} />
      <QuickActions summary={summary} onScenarioChange={setScenarioKey} />
    </div>
  )
}

export default Dashboard
