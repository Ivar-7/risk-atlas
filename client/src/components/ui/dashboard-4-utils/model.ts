import type { LocationRow, RunResult } from '../../../features/model/types'
import { housingClassColor } from '../../../lib/chartTheme'

export type Scenario = RunResult['scenarios'][number]

export function validateDashboardRun(run: RunResult): void {
  if (!Array.isArray(run.scenarios) || !Array.isArray(run.locations) || !Array.isArray(run.ep_curve) || !Array.isArray(run.by_housing_class) || !Array.isArray(run.hotspots)) {
    throw new Error('The model API returned an incomplete run')
  }
  if (!Number.isFinite(run.metrics?.synthetic_locations) || !Number.isFinite(run.metrics?.locations)) {
    throw new Error('The model API is missing portfolio provenance counts')
  }
  if (!Number.isFinite(run.metrics?.ground_up_aal_kes) || !Number.isFinite(run.metrics?.net_aal_kes) || !Number.isFinite(run.controls?.deductible_pct) || !Number.isFinite(run.controls?.policy_limit_pct) || !Number.isFinite(run.controls?.quota_share_ceded_pct) || typeof run.controls?.cat_xol_applies !== 'boolean') {
    throw new Error('The saved portfolio run lacks financial terms or net loss from the current model. Run the portfolio model again to update it.')
  }
  if (run.simulated_ep?.years !== 10_000 || !Array.isArray(run.simulated_ep?.points) || !run.simulated_ep.points.some((point) => point.return_period_years === 500 && Number.isFinite(point.simulated_loss_kes) && Number.isFinite(point.p05_kes) && Number.isFinite(point.p95_kes))) {
    throw new Error('The saved portfolio run lacks the conditional simulation output. Run the portfolio model again to update it.')
  }
  if (!Array.isArray(run.vulnerability_matrix) || run.vulnerability_matrix.length === 0 || run.vulnerability_matrix.some((row) => run.scenarios.some((scenario) => !Number.isFinite(row.by_tier?.[scenario.tier])))) {
    throw new Error('The model API is missing the five-tier vulnerability matrix; restart the updated backend and run the model again')
  }
  if (!Number.isFinite(run.hazard_validation?.detected_common) || !Array.isArray(run.sensitivity?.return_periods)) {
    throw new Error('The model API is missing hotspot validation or assumption sensitivity; restart the updated backend')
  }
  if (run.interventions?.drainage?.validation_status !== 'unvalidated sensitivity' || !Number.isFinite(run.metrics?.drainage_delta_1_in_100_kes)) {
    throw new Error('The model API is missing the drainage sensitivity disclosure; restart the updated backend')
  }
  for (const scenario of run.scenarios) {
    if (!Number.isFinite(scenario.loss_kes) || !Number.isFinite(scenario.ground_up_loss_kes) || !Number.isFinite(scenario.quota_share_recovery_kes) || !Number.isFinite(scenario.cat_xol_recovery_kes) || !Number.isFinite(scenario.net_loss_kes) || !Number.isFinite(scenario.drainage_sensitivity_loss_kes) || !Number.isFinite(scenario.affected_tiv_kes) || !Number.isFinite(scenario.affected_locations)) {
      throw new Error('The model API is missing dashboard scenario values')
    }
    if (run.locations.some((location) => !Number.isFinite(location.scenario_losses_kes?.[scenario.tier]) || !Number.isFinite(location.ground_up_scenario_losses_kes?.[scenario.tier]) || !Number.isFinite(location.hazard_scores?.[scenario.tier]))) {
      throw new Error('The model API is missing per-location scenario values')
    }
  }
}

export function scenarioLoss(location: LocationRow, tier: string): number {
  return location.scenario_losses_kes[tier]
}

export function scenarioHazard(location: LocationRow, tier: string): number {
  return location.hazard_scores[tier]
}

export function scenarioLabel(scenario: Scenario): string {
  return `1-in-${scenario.return_period_years}`
}

export function constructionColor(housingClass: string): string {
  return housingClassColor(housingClass)
}

export function downloadScenario(run: RunResult, scenario: Scenario, locations: LocationRow[] = run.locations, scope = ''): void {
  const columns = ['location_id', 'sample_record', 'latitude', 'longitude', 'housing_class', 'tiv_kes', 'deductible_kes', 'policy_limit_kes', 'proxy_tier', 'susceptibility_score', 'modelled_ground_up_loss_kes', 'modelled_gross_insured_loss_kes']
  const escapeCsv = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`
  const lines = locations.map((location) => [
    location.loc_id, location.synthetic, location.lat, location.lon, location.housing_class,
    location.tiv_kes, location.deductible_kes, location.policy_limit_kes, scenario.tier, scenarioHazard(location, scenario.tier),
    location.ground_up_scenario_losses_kes[scenario.tier],
    scenarioLoss(location, scenario.tier),
  ].map(escapeCsv).join(','))
  const blob = new Blob([[columns.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `risk-atlas-${run.run_id.slice(0, 8)}${scope ? `-${scope}` : ''}-${scenario.tier}-loss.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
