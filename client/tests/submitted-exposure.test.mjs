import assert from 'node:assert/strict'
import { test } from 'node:test'
import { submittedExposure } from '../src/features/model/submittedExposure.ts'

const starter = Array.from({ length: 600 }, (_, index) => ({
  loc_id: `BASE-${index}`, source: 'starter kit', tiv_kes: 10_000_000, aal_kes: 100_000,
  scenario_losses_kes: { occasional: 1_000_000 }, ground_up_scenario_losses_kes: { occasional: 1_200_000 },
}))
const added = Array.from({ length: 25 }, (_, index) => ({
  loc_id: `TXT-${String(index).padStart(4, '0')}`, source: 'reviewed free-text exposure',
  tiv_kes: 800_000, aal_kes: 2_000,
  scenario_losses_kes: { occasional: index < 10 ? 100_000 : 0 },
  ground_up_scenario_losses_kes: { occasional: index < 10 ? 120_000 : 0 },
}))
const run = { interventions: { free_text: { rows_added: 25 } }, locations: [...starter, ...added], scenarios: [{ tier: 'occasional' }] }

test('submitted summary includes only the 25 reviewed houses', () => {
  const summary = submittedExposure(run)
  assert.ok(summary)
  assert.equal(summary.locations.length, 25)
  assert.equal(summary.total_tiv_kes, 20_000_000)
  assert.equal(summary.aal_kes, 50_000)
  assert.deepEqual(summary.scenarios.occasional, {
    tier: 'occasional', ground_up_loss_kes: 1_200_000, loss_kes: 1_000_000,
    affected_locations: 10, affected_tiv_kes: 8_000_000,
  })
})

test('incomplete submitted rows cannot fall back to portfolio totals', () => {
  assert.equal(submittedExposure({ ...run, locations: [...starter, ...added.slice(0, 24)] }), null)
  assert.equal(submittedExposure({ ...run, interventions: { free_text: { rows_added: 0 } } }), null)
})
