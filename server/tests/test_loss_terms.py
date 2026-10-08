from decimal import Decimal
import unittest

from pydantic import ValidationError

from app.engine.loss_terms import LossTerms, calculate_loss


class LossTermsTests(unittest.TestCase):
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
        self.assertEqual(result['net_loss_kes'], 0)

    def test_missing_layer_and_invalid_share_are_rejected(self):
        base = dict(ground_up_loss_kes='1000000', deductible_kes='0', policy_limit_kes='1000000')
        with self.assertRaises(ValidationError):
            LossTerms(**base, quota_share_ceded_pct='101', cat_xol_applies=False)
        with self.assertRaises(ValidationError):
            LossTerms(**base, quota_share_ceded_pct='25', cat_xol_applies=True)


if __name__ == '__main__':
    unittest.main()
