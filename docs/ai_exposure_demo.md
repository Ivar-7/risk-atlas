# Model-backed exposure demo

Use the portfolio runner's **Load synthetic residential offer example** button. The example is a fabricated residential schedule within this model's supported classes:

> Synthetic residential offer for a Nairobi flood CAT demonstration. The schedule contains 25 informal iron-sheet houses in Kibera. Each building has an insured value of KES 800,000.

Set `OPENAI_API_KEY` in `server/.env` and restart the API before the demo. Preview the offer. The preview must say **AI extraction** and show the model name, 25 buildings, Kibera, informal iron-sheet construction, and KES 800,000 per building. Review the fields against the offer, tick the confirmation, and run with the same drainage and property terms as the baseline. If the preview says **Rules extraction**, the run is not evidence of model-backed extraction.

The saved run contains `exposure_review`: the exact supplied text, reviewed groups, source, returned model identity, Responses API response ID, confirmation, and time. `exposure_comparison` computes the starter portfolio with the same hazard, drainage setting, vulnerability and property terms, then reports both results for TIV, AAL, and every scenario loss. The dashboard's **What changed in this run** panel displays the record and comparison. The empty-text baseline has no AI exposure.

On 8 October 2026, a live `gpt-6-luna` preview extracted the stated 25 buildings and the reviewed local API run produced 600 → 625 locations, KES 6,363,470,000 → 6,383,470,000 TIV, and a 1-in-100 gross insured loss increase of KES 1,768,524. [The captured evidence](live_ai_demo_evidence.json) includes the actual response ID, extracted rows, review record, and before/after figures. Database persistence was mocked for this local demo to avoid adding a test run to the configured shared database. A separate controlled-response test can be repeated with `PYTHONPATH=server server/.venv/bin/python -m unittest server.tests.test_ai_exposure_demo`.
