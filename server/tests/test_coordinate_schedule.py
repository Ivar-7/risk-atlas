"""User coordinates must match the reviewed exposure before raster sampling."""

import unittest

from app.engine.coordinate_schedule import coordinate_exposure, parse_coordinate_csv
from app.engine.hazard_validation import proxy_score
from app.engine.ingestion import load_portfolio
from app.engine.pipeline import run_model


class CoordinateScheduleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portfolio = load_portfolio()

    def setUp(self):
        self.groups = [{'count': 2, 'place': 'Kibera', 'housing_class': 'informal_iron_sheet', 'tiv_each_kes': 800_000}]
        self.csv = (
            'loc_id,place,housing_class,tiv_kes,lat,lon,coordinate_source,address\n'
            'KIB-1,Kibera,informal_iron_sheet,800000,-1.3113,36.7890,client schedule,Plot 1\n'
            'KIB-2,Kibera,informal_iron_sheet,800000,-1.3114,36.7891,client schedule,Plot 2\n'
        ).encode()

    def test_exact_points_are_used_for_raster_lookup(self):
        rows = parse_coordinate_csv(self.csv, self.groups, self.portfolio.hotspots)
        extra = coordinate_exposure(rows)
        self.assertEqual(list(extra['lat']), [-1.3113, -1.3114])
        run = run_model({'exposure_groups': self.groups, 'coordinate_rows': rows, 'exposure_source': 'openai'}, self.portfolio)
        added = [row for row in run['locations'] if row['source'] == 'reviewed coordinate schedule']
        self.assertEqual(len(added), 2)
        self.assertEqual(added[0]['address'], 'Plot 1')
        self.assertEqual(added[0]['coordinate_source'], 'client schedule')
        self.assertAlmostEqual(added[0]['hazard_scores']['common'], proxy_score(-1.3113, 36.7890, 'common'))

    def test_rejects_group_mismatch_and_duplicate_ids(self):
        with self.assertRaisesRegex(ValueError, 'must match'):
            parse_coordinate_csv(self.csv.replace(b'800000,-1.3114', b'900000,-1.3114'), self.groups, self.portfolio.hotspots)
        with self.assertRaisesRegex(ValueError, 'unique loc_id'):
            parse_coordinate_csv(self.csv.replace(b'KIB-2', b'KIB-1'), self.groups, self.portfolio.hotspots)

    def test_rejects_position_outside_raster(self):
        with self.assertRaisesRegex(ValueError, 'outside'):
            parse_coordinate_csv(self.csv.replace(b'-1.3113,36.7890', b'0,0'), self.groups, self.portfolio.hotspots)


if __name__ == '__main__':
    unittest.main()
