# Risk Atlas

Catastrophe risk modelling for Kenya Re hackathon.

## Run locally

Start the model API from the repository root:

```bash
python -m venv server/.venv
server/.venv/bin/pip install -r server/requirements.txt
PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

In another terminal, start the frontend:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173/dashboard/` for the live API-backed overview or
`http://localhost:5173/app/` for live model runs, AI controls, explanations,
and the audit ledger. Vite proxies `/api` to port 8000. Production hosting
must route `/api` to the FastAPI service on the same origin. The dashboard
requires that service; it does not display bundled fallback results. Its map
uses OpenStreetMap tiles and needs network access.

The included exposure CSV is synthetic. To use your own geocoded portfolio,
set `RISK_ATLAS_EXPOSURE_CSV=/absolute/path/to/exposure.csv` before starting
the API. The CSV must contain the columns used by the sample in
`data/exposure_nairobi_with_hazard.csv`, including `synthetic` (`true` or
`false`) and the five `hazard_score_*` fields. Set `synthetic=false` only for
locations whose provenance you have verified. The API reports the declared
synthetic count; it does not verify source authenticity or calibrate the
hazard and vulnerability assumptions.

## Structure

- `server/`  model engine and API
- `client/`  React + Tailwind frontend
- `data/`    small sample datasets only
- `docs/`    API contract and modelling assumptions
- `config/` model parameters and assumptions register

## Run backend

cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
