from decimal import Decimal
import unittest

from pydantic import ValidationError

from app.engine.loss_terms import LossTerms, calculate_loss
from app.engine.financial import portfolio_reinsurance


class LossTermsTests(unittest.TestCase):
    def test_portfolio_treaty_applies_once_to_aggregate_event_loss(self):
        result = portfolio_reinsurance(
            {'small': 4_000_000, 'large': 10_000_000}, 25, True, 2_000_000, 5_000_000,
        )
        self.assertEqual(result['small']['quota_share_recovery_kes'], 1_000_000)
        self.assertEqual(result['small']['cat_xol_recovery_kes'], 1_000_000)
        self.assertEqual(result['small']['net_loss_kes'], 2_000_000)
        self.assertEqual(result['large']['quota_share_recovery_kes'], 2_500_000)
        self.assertEqual(result['large']['cat_xol_recovery_kes'], 5_000_000)
        self.assertEqual(result['large']['net_loss_kes'], 2_500_000)

    def test_portfolio_treaty_rejects_incomplete_or_invalid_terms(self):
        with self.assertRaisesRegex(ValueError, 'attachment and layer limit'):
            portfolio_reinsurance({'event': 1_000}, 0, True, None, 1_000)
        with self.assertRaisesRegex(ValueError, 'Quota share'):
            portfolio_reinsurance({'event': 1_000}, float('nan'), False, None, None)

    def test_quota_share_then_cat_xol_on_retained_occurrence(self):
        result = calculate_loss(LossTerms(
            ground_up_loss_kes='12000000', deductible_kes='500000', policy_limit_kes='10000000',
            quota_share_ceded_pct='25', cat_xol_applies=True,
            cat_xol_attachment_kes='2000000', cat_xol_limit_kes='5000000',
        ))
        self.assertEqual(result['gross_loss_kes'], Decimal('10000000'))
        self.assertEqual(result['quota_share_recovery_kes'], Decimal('2500000.00'))
        self.assertEqual(result['cat_xol_recovery_kes'], Decimal('5000000'))
        self.assertEqual(result['net_loss_kes'], Decimal('2500000.00'))

    def test_below_deductible_and_no_cat_layer(self):
        result = calculate_loss(LossTerms(
            ground_up_loss_kes='400000', deductible_kes='500000', policy_limit_kes='1000000',
            quota_share_ceded_pct='0', cat_xol_applies=False,
        ))
        self.assertEqual(result['gross_loss_kes'], 0)
        self.assertEqual(result['deductible_applied_kes'], Decimal('400000'))
        self.assertEqual(result['net_loss_kes'], 0)

    def test_missing_layer_and_invalid_share_are_rejected(self):
        base = dict(ground_up_loss_kes='1000000', deductible_kes='0', policy_limit_kes='1000000')
        with self.assertRaises(ValidationError):
            LossTerms(**base, quota_share_ceded_pct='101', cat_xol_applies=False)
        with self.assertRaises(ValidationError):
            LossTerms(**base, quota_share_ceded_pct='25', cat_xol_applies=True)


if __name__ == '__main__':
    unittest.main()
