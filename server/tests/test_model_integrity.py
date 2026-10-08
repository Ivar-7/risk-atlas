import io
import json
import unittest
from unittest.mock import patch

import pandas as pd

from app.engine.exposure_rules import parse_free_text
from app.engine.exposure_preview import preview_exposure
from app.engine.hazard_validation import hotspot_validation
from app.engine.ingestion import load_portfolio
from app.engine.pipeline import run_model


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

    def test_free_text_example_uses_the_explicit_count_and_value(self):
        rows, meta = parse_free_text('25 informal iron-sheet houses in Kibera, KES 800000 each', self.data.hotspots)
        self.assertEqual(len(rows), 25)
        self.assertEqual(rows['tiv_kes'].sum(), 20_000_000)
        self.assertEqual(meta['groups'][0]['housing_class'], 'informal_iron_sheet')
        missing, invalid = parse_free_text('25 houses in Kibera', self.data.hotspots)
        self.assertTrue(missing.empty)
        self.assertIn('Skipped', invalid['notes'][0])

    def test_model_extraction_is_reviewable_and_changes_exposure(self):
        response = {"output": [{"content": [{"type": "output_text", "text": json.dumps({"groups": [{
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


if __name__ == '__main__':
    unittest.main()
