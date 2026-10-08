import unittest

from app.engine.ingestion import load_portfolio
from app.engine.pipeline import run_model
from app.schemas import RunRequest


class DrainageSensitivityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portfolio = load_portfolio()

    def test_default_run_excludes_unvalidated_uplift_and_reports_comparison(self):
        self.assertFalse(RunRequest().apply_drainage_correction)
        result = run_model(ingested=self.portfolio)
        self.assertFalse(result['controls']['apply_drainage_correction'])
        self.assertEqual(result['interventions']['drainage']['validation_status'], 'unvalidated sensitivity')
        self.assertEqual(len(result['interventions']['drainage']['sensitivity_missed_hotspots']), 12)
        self.assertGreater(result['interventions']['drainage']['sensitivity_buildings_uplifted'], 0)
        for scenario in result['scenarios']:
            self.assertAlmostEqual(scenario['loss_kes'], scenario['baseline_loss_kes'])
            self.assertGreaterEqual(scenario['drainage_sensitivity_loss_kes'], scenario['baseline_loss_kes'])
        reference = next(row for row in result['scenarios'] if row['return_period_years'] == 100)
        self.assertAlmostEqual(
            result['metrics']['drainage_delta_1_in_100_kes'],
            reference['drainage_sensitivity_loss_kes'] - reference['baseline_loss_kes'],
        )

    def test_enabled_run_matches_reported_sensitivity_at_same_terms(self):
        result = run_model({'apply_drainage_correction': True, 'deductible_pct': 5, 'policy_limit_pct': 60}, ingested=self.portfolio)
        self.assertTrue(result['controls']['apply_drainage_correction'])
        for scenario in result['scenarios']:
            self.assertAlmostEqual(scenario['loss_kes'], scenario['drainage_sensitivity_loss_kes'])
            self.assertGreaterEqual(scenario['loss_kes'], scenario['baseline_loss_kes'])


if __name__ == '__main__':
    unittest.main()
