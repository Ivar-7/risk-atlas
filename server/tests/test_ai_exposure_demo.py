"""End-to-end review and loss comparison using a controlled model response."""

from datetime import datetime, timezone
import io
import json
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app import main
from app.engine.ingestion import load_portfolio
from app.schemas import PreviewRequest, RunRequest


OFFER = (
    "Synthetic residential offer for a Nairobi flood CAT demonstration. "
    "The schedule contains 25 informal iron-sheet houses in Kibera. "
    "Each building has an insured value of KES 800,000."
)


class AiExposureDemoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portfolio = load_portfolio()

    def test_reviewed_model_extraction_changes_tiv_and_loss(self):
        response = {
            "id": "resp_demo_123",
            "model": "gpt-demo-snapshot",
            "output": [{"content": [{"type": "output_text", "text": json.dumps({"groups": [{
                "count": 25, "housing_class": "informal_iron_sheet",
                "place": "Kibera", "tiv_each_kes": 800_000,
            }]})}]}],
        }
        with patch.object(main, "PORTFOLIO", self.portfolio), patch.dict("os.environ", {"OPENAI_API_KEY": "test-only-key"}), patch("app.engine.exposure_preview.urlopen", return_value=io.BytesIO(json.dumps(response).encode())):
            preview = main.preview(PreviewRequest(free_text=OFFER), claims={"sub": "user_demo"})
        self.assertEqual(preview["model"], "gpt-demo-snapshot")
        self.assertEqual(preview["response_id"], "resp_demo_123")

        request = RunRequest(free_text=OFFER, preview_id=preview["preview_id"], exposure_reviewed=True)
        saved = []
        with patch.object(main, "PORTFOLIO", self.portfolio), patch.object(main, "save_run", side_effect=saved.append), patch.object(main, "append_run", return_value={"entry_hash": "test"}):
            with self.assertRaises(HTTPException) as unreviewed:
                main.create_run(request.model_copy(update={"exposure_reviewed": False}), claims={"sub": "user_demo"})
            self.assertEqual(unreviewed.exception.status_code, 422)
            with self.assertRaises(HTTPException) as wrong_owner:
                main.create_run(request, claims={"sub": "user_other"})
            self.assertEqual(wrong_owner.exception.status_code, 422)
            result = main.create_run(request, claims={"sub": "user_demo"})

        self.assertEqual(len(saved), 1)
        self.assertEqual(saved[0]["run_id"], result["run_id"])
        review = result["exposure_review"]
        self.assertEqual(review["input_text"], OFFER)
        self.assertEqual(review["groups"], preview["groups"])
        self.assertEqual(review["model"], "gpt-demo-snapshot")
        self.assertEqual(review["response_id"], "resp_demo_123")
        self.assertTrue(review["reviewed"])
        self.assertLessEqual(datetime.fromisoformat(review["reviewed_at"]), datetime.now(timezone.utc))

        comparison = result["exposure_comparison"]
        before, after = comparison["without_added"], comparison["with_added"]
        self.assertEqual(after["locations"] - before["locations"], 25)
        self.assertEqual(after["total_tiv_kes"] - before["total_tiv_kes"], 20_000_000)
        self.assertGreater(after["scenarios"]["severe"], before["scenarios"]["severe"])
        self.assertAlmostEqual(after["scenarios"]["severe"] - before["scenarios"]["severe"], result["metrics"]["exposure_delta_1_in_100_kes"])


if __name__ == "__main__":
    unittest.main()
