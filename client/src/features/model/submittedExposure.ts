import type { LocationRow, RunResult } from './types'

export type SubmittedScenario = {
  tier: string
  ground_up_loss_kes: number
  loss_kes: number
  affected_locations: number
  affected_tiv_kes: number
}

export type SubmittedExposure = {
  locations: LocationRow[]
  total_tiv_kes: number
  aal_kes: number
  scenarios: Record<string, SubmittedScenario>
}

export function submittedExposure(run: RunResult): SubmittedExposure | null {
  const expected = run.interventions.free_text.rows_added
  const locations = run.locations.filter((location) =>
    ['reviewed free-text exposure', 'parsed from underwriter free text', 'reviewed coordinate schedule'].includes(location.source))
  if (!expected || locations.length !== expected) return null

  const sum = (select: (location: LocationRow) => number) => locations.reduce((total, location) => total + select(location), 0)
  const scenarios = Object.fromEntries(run.scenarios.map((scenario) => {
    const affected = locations.filter((location) => location.ground_up_scenario_losses_kes[scenario.tier] > 0)
    return [scenario.tier, {
      tier: scenario.tier,
      ground_up_loss_kes: sum((location) => location.ground_up_scenario_losses_kes[scenario.tier]),
      loss_kes: sum((location) => location.scenario_losses_kes[scenario.tier]),
      affected_locations: affected.length,
      affected_tiv_kes: affected.reduce((total, location) => total + location.tiv_kes, 0),
    }]
  })) as Record<string, SubmittedScenario>

  return { locations, total_tiv_kes: sum((location) => location.tiv_kes), aal_kes: sum((location) => location.aal_kes), scenarios }
}
