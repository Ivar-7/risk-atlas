# Model-backed exposure demo

Use the portfolio runner's **Load synthetic residential offer example** button. The example is a fabricated residential schedule within this model's supported classes:

> Synthetic residential offer for a Nairobi flood CAT demonstration. The schedule contains 25 informal iron-sheet houses in Kibera. Each building has an insured value of KES 800,000.

Set `OPENAI_API_KEY` in `server/.env` and restart the API before the demo. Preview the offer. The preview must say **AI extraction** and show the model name, 25 buildings, Kibera, informal iron-sheet construction, and KES 800,000 per building. Review the fields against the offer, tick the confirmation, and run with the same drainage and property terms as the baseline. If the preview says **Rules extraction**, the run is not evidence of model-backed extraction.

The saved run contains `exposure_review`: the exact supplied text, reviewed groups, source, returned model identity, Responses API response ID, confirmation, and time. `exposure_comparison` computes the starter portfolio with the same hazard, drainage setting, vulnerability, property terms and portfolio treaty, then reports both results for TIV, gross/net AAL, and every gross/net scenario loss. The dashboard's **What changed in this run** panel displays the record and comparison. The empty-text baseline has no AI exposure.

On 8 October 2026, a live `gpt-6-luna` preview extracted the stated 25 buildings. [The original live-demo evidence](live_ai_demo_evidence.json) records a local reviewed API run under the previous continuous vulnerability method: 600 → 625 locations, KES 6,363,470,000 → 6,383,470,000 TIV, and a KES 1,768,524 increase in 1-in-100 gross loss. Database persistence was mocked for that demonstration.

[Current v1.3.0 evidence](current_ai_replay_evidence.json) comes from a separate saved, reviewed live `gpt-6-luna` extraction of the same synthetic offer. The current model replay preserved its reviewed groups, model identity, response ID, and account ownership. It adds the same 25 buildings and KES 20,000,000 TIV, increases gross AAL by KES 187,720, and increases the assumed 1-in-100 gross loss by KES 5,400,000. The replay called no AI service; it recalculated losses from the earlier reviewed AI output. A controlled-response integration test can be repeated with `PYTHONPATH=server server/.venv/bin/python -m unittest server.tests.test_ai_exposure_demo`.
