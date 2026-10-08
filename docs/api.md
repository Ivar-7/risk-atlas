# Model API

Run `PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --port 8000` from the repository root. The frontend proxies `/api` to this service in development.

Set `DATABASE_URL` to the Neon pooled PostgreSQL URL in `server/.env` for run persistence. The API initializes its `model_runs` table on startup. Set `CLERK_SECRET_KEY` and `CLERK_AUTHORIZED_PARTIES` there as well. Clerk handles accounts in the frontend. Every model endpoint below requires a valid Clerk session; only health is public.

- `GET /api/health` — service status and latest run ID.
- `GET /api/defaults` — model parameters and assumptions.
- `GET /api/runs/latest` — most recent run.
- `POST /api/runs` — run with `{ "apply_drainage_correction": true, "free_text": "" }`. Free text is limited to 4,000 characters.
- `GET /api/runs/{run_id}` — a run by ID, including persisted Neon runs.
- `GET /api/runs/{run_id}/explain/{loc_id}` — local SHAP explanation for one location.
- `GET /api/audit` — hash-chain validation and recent run records.
- `POST /api/documents/analyze` — multipart `file` upload (`.pdf` or `.docx`, up to 10 MB). Returns extracted fields with page/block evidence, the point hazard proxy, missing fields, review checks, and measured processing time. Uploaded bytes are not stored. Scanned PDFs need OCR first. This does not add a property to a model run or issue an acceptance decision.
- `POST /api/loss/calculate` — calculates one occurrence from verified `ground_up_loss_kes`, `deductible_kes`, `policy_limit_kes`, `quota_share_ceded_pct`, and `cat_xol_applies`. When the catastrophe layer applies, supply `cat_xol_attachment_kes` and `cat_xol_limit_kes`. Amounts are decimal strings in KES. Gross loss is the loss after deductible capped at the policy limit; quota share is ceded next; the applicable catastrophe layer recovers from the remaining loss. Monetary outputs are decimal strings. This endpoint does not infer ground-up loss from coordinates, insured value, or the hazard proxy.

The API creates an initial run when it starts. With Neon configured, full runs and explanations are also stored in PostgreSQL. Summarized run files and the audit ledger remain in `server/runs/`. Without Neon, runs exist only for the current server process.

Each run includes scenario `affected_tiv_kes` and, on every location, `scenario_losses_kes` and `hazard_scores` keyed by source tier. The dashboard uses these fields directly so its cards, charts, map, and CSV export all refer to the same run.

Set `RISK_ATLAS_EXPOSURE_CSV` to an absolute CSV path at API startup to replace the bundled synthetic exposure. The file must include the sample exposure columns and explicit `synthetic` values. Run metrics include `synthetic_locations`, and each location retains its `synthetic` and `source` provenance fields.
