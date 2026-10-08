# Risk Atlas

Catastrophe risk modelling for Kenya Re hackathon.

## Run locally

Start the model API from the repository root:

```bash
python -m venv server/.venv
server/.venv/bin/pip install -r server/requirements.txt
PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

On Windows PowerShell, use:

```powershell
python -m venv server\.venv
server\.venv\Scripts\python.exe -m pip install -r server\requirements.txt
$env:PYTHONPATH = "server"
server\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Local environment files are `server/.env` and `client/.env`. For a fresh
checkout, copy each folder's `.env.example` once and fill in local values.
Never commit either `.env` file.

In Neon, open the `risk-atlas` project, select the `production` branch, and
copy its pooled PostgreSQL connection string from **Connect**. Set that string
as `DATABASE_URL` in `server/.env`. The backend loads that file, requires TLS
for database connections, and creates the `model_runs` table on startup.
Model runs can then be fetched by ID after an API restart. Never put the
connection string in `client/` or a `VITE_*` variable. The server needs its own
persistent process; Vite only proxies `/api` during local development.

Clerk owns sign-in, sign-up, verification, and profile management in the
frontend. Put the publishable key in `client/.env` as
`VITE_CLERK_PUBLISHABLE_KEY`; the dashboard and model workspace require a
Clerk session. The API does not verify Clerk tokens, so its endpoints are
public and must not be treated as an authorization boundary. Use an API
gateway or server-side authentication if direct API access must be restricted.
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is for Next.js and is not read by Vite.
Without `DATABASE_URL`, model runs remain available only for the current server
process.

In another terminal, start the frontend:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173/dashboard/` for the live API-backed overview. The
dashboard sidebar contains the model workspace, document review, explanations,
and the audit ledger. The old `/app/` path redirects to the workspace tab.
The document review tab accepts text PDFs and `.docx` files, and includes the
supplied PDF and Word offer as sample inputs. It shows extracted source evidence,
the location proxy, and checks for the underwriter; it does not calculate a
commercial property loss or make a final decision. Vite proxies `/api` to port 8000. Production hosting
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
extraction, set `OPENAI_API_KEY` in `server/.env` and optionally
`RISK_ATLAS_OPENAI_MODEL` (default `gpt-4o-mini`). The backend calls the
OpenAI Responses API; the key stays server-side. The user reviews extracted
count, class, named place, and value before those synthetic rows change the
loss curve. The drainage-gap correction is a deterministic rule, not AI.

The map's transparent proxy layers are generated from the supplied GeoTIFFs
with `python3 scripts/build_proxy_overlays.py` (requires Pillow and numpy).
Regenerate these images if the source rasters change. Hotspot detection is
sampled from the rasters by the backend on each run; named-centre coordinates
are approximate. To use a different API port with Vite, set
`RISK_ATLAS_API_TARGET=http://127.0.0.1:8001` in `client/.env`.

The included exposure CSV is synthetic. To use your own geocoded portfolio,
set `RISK_ATLAS_EXPOSURE_CSV=/absolute/path/to/exposure.csv` in `server/.env`.
The CSV must contain the columns used by the sample in
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

## Deploy the API to Heroku

Deploy this repository's **root**, not just `server/`. The root `requirements.txt`
lets Heroku detect Python, while `Procfile` starts Uvicorn with `server/` as the
app directory. Keeping the repository root also makes the API's `config/` and
`data/` paths resolve correctly.

1. Push the repository to GitHub and create a Heroku app.
2. In the Heroku Dashboard, open the app's **Deploy** tab, find **Deployment
	method**, choose **GitHub**, connect the repository, and select the branch
	containing these files. Do not choose a subdirectory; the GitHub integration
	deploys the repository root.
3. On the app's **Settings** tab, select **Reveal Config Vars** and add
	`RISK_ATLAS_CORS_ORIGINS` if the frontend is hosted on a different origin.
	Add `DATABASE_URL` using your PostgreSQL connection string if runs must
	persist across dyno restarts. Set `OPENAI_API_KEY` only if model-backed
	exposure extraction is required. Keep all secret values out of Git.
4. Return to **Deploy** and click **Deploy Branch**. For a Git-connected app,
	Heroku will build the root `requirements.txt` and use the root `Procfile`.
5. In **More** > **View logs**, confirm the release starts. Open
	`https://<your-app-name>.herokuapp.com/api/health`; a healthy API returns
	`{"status":"ok",...}`. Swagger docs are at `/docs`.

If automatic detection still fails, open **Settings** > **Buildpacks** >
**Add buildpack**, select `heroku/python`, and save. The normal fix is having
the root `requirements.txt`; there is no GitHub deploy setting for a server
subdirectory. The deployed API returns 404 at `/` because the Heroku
`Procfile` runs only FastAPI. The frontend must be hosted separately or served
by a frontend host; configure `VITE_API_BASE_URL` to point its browser requests
at this API.

## Run backend

cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
