"""A credit outage must not turn a spoken demo into an unexplained 502."""

from io import BytesIO
import json
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from app.engine.exposure_preview import preview_exposure
from app.engine.ingestion import load_portfolio


class VoiceFallbackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.hotspots = load_portfolio().hotspots

    def test_credit_exhaustion_uses_clearly_labelled_rules(self):
        text = 'Add twenty five informal iron-sheet houses in Kibera. Each building has an insured value of 800,000 Kenyan shillings.'
        error = HTTPError('https://api.openai.com/v1/responses', 429, 'quota', {}, BytesIO(json.dumps({'error': {'code': 'credit_balance_exhausted'}}).encode()))
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.engine.exposure_preview.urlopen', side_effect=error):
            preview = preview_exposure(text, self.hotspots)
        self.assertEqual(preview['source'], 'rules')
        self.assertEqual(preview['rows_added'], 25)
        self.assertEqual(preview['total_tiv_kes'], 20_000_000)
        self.assertIn('no AI extraction', preview['notes'][0])


if __name__ == '__main__':
    unittest.main()
