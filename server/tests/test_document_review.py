from pathlib import Path
from io import BytesIO
import unittest
from docx import Document

from app.engine.document_review import review_document


SAMPLES = Path(__file__).resolve().parents[2] / 'client' / 'public' / 'test_documents'


class DocumentReviewTests(unittest.TestCase):
    def test_pdf_and_word_offer_agree_on_critical_terms(self):
        outcomes = [review_document(path.name, path.read_bytes()) for path in sorted(SAMPLES.glob('OFFER_NAIROBI_LANDMARK_PLAZA.*'))]
        self.assertEqual(len(outcomes), 2)
        for result in outcomes:
            fields = result['fields']
            self.assertEqual(fields['reference']['value'], 'EIB-NAI-LP-2026-001')
            self.assertEqual(fields['total_insured_value']['value'], '1,090,000,000')
            self.assertIn('excluding flood', fields['coverage']['value'])
            self.assertIn('basement', fields['floors']['value'])
            self.assertEqual(result['missing'], [])
            self.assertEqual(result['model_evidence']['latitude'], -1.2847)
            self.assertTrue(all(score == 0 for score in result['model_evidence']['tiers'].values()))
            self.assertTrue(any('zero proxy signal is not proof' in check for check in result['advice']['checks']))
            self.assertTrue(any('residential RCC' in check for check in result['advice']['checks']))
        self.assertEqual({key: field['value'] for key, field in outcomes[0]['fields'].items()},
                         {key: field['value'] for key, field in outcomes[1]['fields'].items()})

    def test_unsupported_and_empty_files_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'PDF or Word'):
            review_document('offer.txt', b'A' * 100)
        with self.assertRaisesRegex(ValueError, 'non-empty'):
            review_document('offer.pdf', b'')

    def test_loss_terms_are_extracted_only_when_stated(self):
        document = Document()
        document.add_paragraph('Client: Example Property Holdings')
        document.add_paragraph('Ground-up loss: KES 12,000,000')
        document.add_paragraph('Flood deductible: KES 500,000')
        document.add_paragraph('Limit: KES 10,000,000')
        document.add_paragraph('Gross loss: KES 9,500,000')
        document.add_paragraph('Quota share: 25%')
        document.add_paragraph('Catastrophe excess of loss: KES 5,000,000 xs KES 2,000,000')
        document.add_paragraph('Net loss: KES 2,375,000')
        buffer = BytesIO()
        document.save(buffer)
        fields = review_document('terms.docx', buffer.getvalue())['fields']
        self.assertEqual(fields['ground_up_loss']['value'], '12,000,000')
        self.assertEqual(fields['flood_deductible']['value'], 'KES 500,000')
        self.assertEqual(fields['limit']['value'], '10,000,000')
        self.assertEqual(fields['gross_loss']['value'], '9,500,000')
        self.assertEqual(fields['quota_share']['value'], '25%')
        self.assertIn('5,000,000 xs KES 2,000,000', fields['catastrophe_excess_of_loss']['value'])
        self.assertEqual(fields['net_loss']['value'], '2,375,000')

    def test_valid_coordinates_are_returned_even_outside_proxy(self):
        document = Document()
        document.add_paragraph('Client: Example Property Holdings')
        document.add_paragraph('Street address: Example Road')
        document.add_paragraph('GPS coordinates: 0.123456, 36.654321')
        buffer = BytesIO()
        document.save(buffer)
        evidence = review_document('location.docx', buffer.getvalue())['model_evidence']
        self.assertEqual((evidence['latitude'], evidence['longitude']), (0.123456, 36.654321))
        self.assertFalse(evidence['proxy_covered'])
        self.assertEqual(evidence['tiers'], {})


if __name__ == '__main__':
    unittest.main()
