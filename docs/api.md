# Model API

Run `PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --port 8000` from the repository root. The frontend proxies `/api` to this service in development.

- `GET /api/health` — service status and latest run ID.
- `GET /api/defaults` — model parameters and assumptions.
- `GET /api/runs/latest` — most recent in-memory run.
- `POST /api/runs` — run with `{ "apply_drainage_correction": true, "free_text": "" }`. Free text is limited to 4,000 characters.
- `GET /api/runs/{run_id}` — an in-memory run by ID.
- `GET /api/runs/{run_id}/explain/{loc_id}` — local SHAP explanation for one location.
- `GET /api/audit` — hash-chain validation and recent run records.

The API creates an initial run when it starts. Runs and their explanations are held in memory; summarized run files and the audit ledger are written to `server/runs/`. Restarting the API creates a new initial run, and older run IDs are not loaded into memory.

Each run includes scenario `affected_tiv_kes` and, on every location, `scenario_losses_kes` and `hazard_scores` keyed by source tier. The dashboard uses these fields directly so its cards, charts, map, and CSV export all refer to the same run.

Set `RISK_ATLAS_EXPOSURE_CSV` to an absolute CSV path at API startup to replace the bundled synthetic exposure. The file must include the sample exposure columns and explicit `synthetic` values. Run metrics include `synthetic_locations`, and each location retains its `synthetic` and `source` provenance fields.
