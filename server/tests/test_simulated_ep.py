"""The display simulation stays conditional on the five financial anchors."""

import unittest

from app.engine.simulated_ep import simulated_ep


class SimulatedEpTests(unittest.TestCase):
    def setUp(self):
        self.scenarios = [
            {'return_period_years': years, 'loss_kes': loss}
            for years, loss in [(10, 10), (25, 20), (50, 30), (100, 40), (250, 50)]
        ]

    def test_reproducible_monotone_curve_with_explicit_tail(self):
        result = simulated_ep(self.scenarios, 100, years=10_000, bootstraps=20, seed=7)
        self.assertEqual(result, simulated_ep(self.scenarios, 100, years=10_000, bootstraps=20, seed=7))
        self.assertEqual(result['years'], 10_000)
        points = result['points']
        self.assertEqual([p['return_period_years'] for p in points], [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000])
        self.assertTrue(all(a['simulated_loss_kes'] <= b['simulated_loss_kes'] for a, b in zip(points, points[1:])))
        self.assertTrue(all(0 <= p['p05_kes'] <= p['p95_kes'] <= 100 for p in points))
        self.assertFalse(points[4]['extrapolated'])
        self.assertTrue(points[5]['extrapolated'])

    def test_rejects_nonmonotone_anchors(self):
        self.scenarios[3]['loss_kes'] = 15
        with self.assertRaises(ValueError):
            simulated_ep(self.scenarios, 100)


if __name__ == '__main__':
    unittest.main()
