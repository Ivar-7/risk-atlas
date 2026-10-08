# Model API

Run `PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --port 8000` from the repository root. The frontend proxies `/api` to this service in development.

Set `DATABASE_URL` to the Neon pooled PostgreSQL URL in `server/.env` for run persistence. The API initializes its `model_runs` table on startup. Set `CLERK_ISSUER` to the Clerk Frontend API origin and `RISK_ATLAS_CORS_ORIGINS` to trusted browser origins. All endpoints except `/api/health` require a Clerk session token in `Authorization: Bearer <token>`. The server checks signature, issuer, expiration, session claims and authorized origin. If verification is not configured, protected endpoints fail closed. Previews, saved runs, explanations and audit entries are scoped to the account; new accounts see the shared synthetic starter run.

- `GET /api/health` — public service status and bundled portfolio size.
- `GET /api/defaults` — model parameters and assumptions.
- `GET /api/runs/latest` — the signed-in account's most recent run, or the shared synthetic starter run.
- `POST /api/runs` — run with `{ "apply_drainage_correction": false, "free_text": "", "deductible_pct": 0, "policy_limit_pct": 100 }`. The drainage rule is off by default; `drainage_sensitivity_loss_kes` and `drainage_delta_1_in_100_kes` compare the unvalidated with-rule scenario against the same exposure and terms without it. Policy percentages must be 0–100 and apply separately to each property's TIV. Free text is limited to 4,000 characters and requires a matching `preview_id` plus `exposure_reviewed: true`.
- `GET /api/runs/{run_id}` — a run by ID, including persisted Neon runs.
- `GET /api/runs/{run_id}/explain/{loc_id}` — local SHAP explanation for one location.
- `GET /api/audit` — hash-chain validation and the signed-in account's recent run records.
- `POST /api/documents/analyze` — multipart `file` upload (`.pdf` or `.docx`, up to 10 MB). Returns extracted fields with page/block evidence, the point hazard proxy, missing fields, review checks, and measured processing time. Uploaded bytes are not stored. Scanned PDFs need OCR first. This does not add a property to a model run or issue an acceptance decision.
- `POST /api/loss/calculate` — calculates one occurrence from verified `ground_up_loss_kes`, `deductible_kes`, `policy_limit_kes`, `quota_share_ceded_pct`, and `cat_xol_applies`. When the catastrophe layer applies, supply `cat_xol_attachment_kes` and `cat_xol_limit_kes`. Amounts are decimal strings in KES. Gross loss is the loss after deductible capped at the policy limit; quota share is ceded next; the applicable catastrophe layer recovers from the remaining loss. Monetary outputs are decimal strings. This endpoint does not infer ground-up loss from coordinates, insured value, or the hazard proxy.

The API creates an initial run when it starts. With Neon configured, full runs and explanations are also stored in PostgreSQL. Summarized run files and the audit ledger remain in `server/runs/`. Without Neon, runs exist only for the current server process.

Each run includes ground-up and gross insured scenario losses. `scenarios` and `ep_curve` include `ground_up_loss_kes`; `loss_kes` is gross insured loss after the per-property deductible and limit. Each location includes `ground_up_scenario_losses_kes`, gross `scenario_losses_kes`, `deductible_kes`, `policy_limit_kes`, and `hazard_scores`, keyed by tier where applicable. The dashboard's cards, charts, map, and CSV export refer to the same run. The portfolio curve does not include reinsurance.

Set `RISK_ATLAS_EXPOSURE_CSV` to an absolute CSV path at API startup to replace the bundled synthetic exposure. The file must include the sample exposure columns and explicit `synthetic` values. Run metrics include `synthetic_locations`, and each location retains its `synthetic` and `source` provenance fields.
