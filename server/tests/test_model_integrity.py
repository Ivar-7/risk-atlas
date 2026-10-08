import io
import json
import unittest
from unittest.mock import patch

import pandas as pd
import numpy as np
from pydantic import ValidationError

from app.engine.exposure_rules import parse_free_text
from app.engine.exposure_preview import preview_exposure
from app.engine.financial import insured_losses
from app.engine.hazard_validation import _raster, hotspot_validation, proxy_point_covered
from app.engine.ingestion import load_portfolio
from app.engine.pipeline import run_model
from app.engine.vulnerability import damage_ratio
from app.schemas import RunRequest


class ModelIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_portfolio()

    def test_exposure_matches_data_dictionary(self):
        self.assertEqual(self.data.row_count, 600)
        self.assertEqual(self.data.total_tiv_kes, 6_363_470_000)

    def test_scaled_starter_value_is_rejected(self):
        original_read_csv = pd.read_csv

        def scaled_first_row(path):
            frame = original_read_csv(path)
            frame.loc[0, 'tiv_kes'] *= 10
            return frame

        with patch('app.engine.ingestion.pd.read_csv', side_effect=scaled_first_row):
            with self.assertRaisesRegex(ValueError, 'Starter TIV does not match'):
                load_portfolio()

    def test_invalid_exposure_is_rejected_before_loss_calculation(self):
        original_read_csv = pd.read_csv
        cases = [
            ('housing_class', 'unsupported_class', 'Unsupported housing_class'),
            ('lat', float('nan'), 'Exposure lat must contain finite numbers'),
            ('lon', 0.0, 'outside the Nairobi hazard raster'),
            ('hazard_score_common', 1.1, 'hazard_score_common must be between 0 and 1'),
        ]
        for field, value, message in cases:
            def modified(path):
                frame = original_read_csv(path)
                if 'exposure_nairobi_with_hazard' in str(path):
                    frame.loc[0, field] = value
                return frame

            with self.subTest(field=field, value=value), patch('app.engine.ingestion.pd.read_csv', side_effect=modified):
                with self.assertRaisesRegex(ValueError, message):
                    load_portfolio()
        with self.assertRaisesRegex(ValueError, 'Unsupported housing_class'):
            damage_ratio(np.array([1.0]), np.array(['unsupported_class']))

    def test_points_just_outside_raster_are_not_treated_as_covered(self):
        _, west, north, width, height = _raster('common')
        self.assertFalse(proxy_point_covered(north - height / 2, west - width / 2))
        self.assertFalse(proxy_point_covered(north + height / 2, west + width / 2))

    def test_free_text_example_uses_the_explicit_count_and_value(self):
        rows, meta = parse_free_text('25 informal iron-sheet houses in Kibera, KES 800000 each', self.data.hotspots)
        self.assertEqual(len(rows), 25)
        self.assertEqual(rows['tiv_kes'].sum(), 20_000_000)
        self.assertEqual(meta['groups'][0]['housing_class'], 'informal_iron_sheet')
        missing, invalid = parse_free_text('25 houses in Kibera', self.data.hotspots)
        self.assertTrue(missing.empty)
        self.assertIn('Skipped', invalid['notes'][0])
        total_only, invalid_total = parse_free_text('25 informal houses in Kibera, total KES 20000000', self.data.hotspots)
        self.assertTrue(total_only.empty)
        self.assertIn('explicit KES value per building', invalid_total['notes'][0])

    def test_model_extraction_is_reviewable_and_changes_exposure(self):
        response = {"id": "resp_test", "model": "gpt-4o-mini", "output": [{"content": [{"type": "output_text", "text": json.dumps({"groups": [{
            "count": 25, "housing_class": "informal_iron_sheet", "place": "Kibera", "tiv_each_kes": 800_000,
        }]})}]}]}
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}), patch('app.engine.exposure_preview.urlopen', return_value=io.BytesIO(json.dumps(response).encode())):
            preview = preview_exposure('25 informal iron-sheet houses in Kibera, KES 800000 each', self.data.hotspots)
        self.assertEqual(preview['source'], 'openai')
        self.assertEqual(preview['rows_added'], 25)
        self.assertEqual(preview['total_tiv_kes'], 20_000_000)

    def test_proxy_validation_and_loss_order(self):
        validation = hotspot_validation(self.data.hotspots)
        self.assertEqual((validation['detected_common'], validation['checked']), (12, 24))
        result = run_model(ingested=self.data)
        losses = [item['loss_kes'] for item in result['scenarios']]
        self.assertEqual(losses, sorted(losses))
        self.assertEqual([item['return_period_years'] for item in result['scenarios']], [10, 25, 50, 100, 250])
        self.assertEqual(result['metrics']['total_tiv_kes'], 6_363_470_000)

    def test_property_deductible_and_limit_then_portfolio_aggregation(self):
        ground_up = {'event': np.array([600_000.0, 150_000.0, 800_000.0])}
        tiv = np.array([1_000_000.0, 500_000.0, 1_000_000.0])
        insured = insured_losses(ground_up, tiv, deductible_pct=10, policy_limit_pct=40)
        np.testing.assert_allclose(insured['event'], [400_000, 100_000, 400_000])
        self.assertEqual(float(insured['event'].sum()), 900_000)

    def test_run_reports_both_loss_bases_consistently(self):
        result = run_model({'deductible_pct': 5, 'policy_limit_pct': 60}, ingested=self.data)
        self.assertEqual(result['controls']['deductible_pct'], 5)
        self.assertEqual(result['controls']['policy_limit_pct'], 60)
        for scenario, curve in zip(result['scenarios'], result['ep_curve']):
            tier = scenario['tier']
            insured = sum(row['scenario_losses_kes'][tier] for row in result['locations'])
            ground_up = sum(row['ground_up_scenario_losses_kes'][tier] for row in result['locations'])
            self.assertAlmostEqual(scenario['loss_kes'], insured, delta=0.001)
            self.assertAlmostEqual(scenario['ground_up_loss_kes'], ground_up, delta=0.001)
            self.assertAlmostEqual(curve['loss_kes'], insured, delta=0.001)
            self.assertAlmostEqual(curve['ground_up_loss_kes'], ground_up, delta=0.001)
            self.assertLessEqual(insured, ground_up)
        for row in result['locations']:
            self.assertAlmostEqual(row['deductible_kes'], row['tiv_kes'] * 0.05)
            self.assertAlmostEqual(row['policy_limit_kes'], row['tiv_kes'] * 0.60)
        default = run_model(ingested=self.data)
        self.assertTrue(all(abs(s['loss_kes'] - s['ground_up_loss_kes']) < 0.01 for s in default['scenarios']))

    def test_invalid_policy_terms_are_rejected(self):
        with self.assertRaises(ValidationError):
            RunRequest(deductible_pct=-1)
        with self.assertRaises(ValidationError):
            RunRequest(policy_limit_pct=101)
        with self.assertRaisesRegex(ValueError, 'Policy percentages'):
            run_model({'deductible_pct': float('nan')}, ingested=self.data)


if __name__ == '__main__':
    unittest.main()
