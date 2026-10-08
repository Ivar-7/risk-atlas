# Risk Atlas

Catastrophe risk modelling for Kenya Re hackathon.

## Run locally

Start the model API from the repository root:

```bash
python -m venv server/.venv
server/.venv/bin/pip install -r server/requirements.txt
cp .env.example .env
# Add your Neon pooled DATABASE_URL to .env
PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

In Neon, open the `risk-atlas` project, select the `production` branch, and
copy its pooled PostgreSQL connection string from **Connect**. Set that string
as `DATABASE_URL` in the root `.env` file. The backend loads `.env`, requires
TLS for database connections, and creates `app_users`, `auth_sessions`, and
`model_runs` on startup. Never put the connection string in `client/` or a
`VITE_*` variable. When deployed behind an HTTPS reverse proxy, set
`RISK_ATLAS_SECURE_COOKIES=true`. The server needs its own persistent process;
Vite only proxies `/api` during local development.

Registration and sign-in use Argon2 password hashes and HTTP-only session
cookies. Model runs are saved in Neon and can be fetched by ID after an API
restart. The sample dashboard remains publicly viewable, while account actions
require the database. Without `DATABASE_URL`, model preview endpoints still
work, but registration and sign-in return a configuration error.

In another terminal, start the frontend:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173/dashboard/` for the live API-backed overview or
`http://localhost:5173/app/` for live model runs, exposure review, explanations,
and the audit ledger. Vite proxies `/api` to port 8000. Production hosting
must route `/api` to the FastAPI service on the same origin. The dashboard
requires that service; it does not display bundled fallback results. Its map
uses OpenStreetMap tiles and needs network access.

The supplied Nairobi exposure CSVs have been reconciled with the dataset
metadata: 600 synthetic locations total KES 6,363,470,000. On startup the API
checks each starter-kit insured value against floor area × rebuilding cost, allowing the
documented KES 5,000 rounding. It refuses inconsistent input rather than
publishing a scaled loss estimate.

Free-text exposure must be previewed before a run. Without an API key, the
preview uses strict rules and is labelled as such. For model-backed structured
extraction, set `OPENAI_API_KEY` in the backend environment and optionally
`RISK_ATLAS_OPENAI_MODEL` (default `gpt-4o-mini`). The backend calls the
OpenAI Responses API; the key stays server-side. The user reviews extracted
count, class, named place, and value before those synthetic rows change the
loss curve. The drainage-gap correction is a deterministic rule, not AI.

The map's transparent proxy layers are generated from the supplied GeoTIFFs
with `python3 scripts/build_proxy_overlays.py` (requires Pillow and numpy).
Regenerate these images if the source rasters change. Hotspot detection is
sampled from the rasters by the backend on each run; named-centre coordinates
are approximate. To use a different API port with Vite, set
`RISK_ATLAS_API_TARGET=http://127.0.0.1:8001` before `npm run dev`.

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
