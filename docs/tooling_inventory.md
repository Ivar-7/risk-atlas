# Risk Atlas tooling inventory

This inventory describes tools directly used by the application and its development workflow. The dependency manifests contain the exact installed package versions and transitive dependencies: [`client/package.json`](../client/package.json) and [`server/requirements.txt`](../server/requirements.txt). An integration listed as optional is used only when its configuration or browser capability is available. No secret values belong in this document.

## Application stack

| Tool or service | What Risk Atlas uses it for | Where to verify | Status |
| --- | --- | --- | --- |
| React and React DOM | Dashboard, workspace, authentication views, voice controls | [`client/src`](../client/src) | Core |
| TypeScript | Frontend types and build checks | [`client/tsconfig.json`](../client/tsconfig.json) | Core |
| Vite | Frontend dev server, `/api` proxy, and production build | [`client/vite.config.js`](../client/vite.config.js) | Core |
| Tailwind CSS | Application styling | [`client/src/index.css`](../client/src/index.css), [`client/vite.config.js`](../client/vite.config.js) | Core |
| FastAPI, Pydantic, Uvicorn | Authenticated HTTP API, request validation, ASGI serving | [`server/app/main.py`](../server/app/main.py), [`server/app/schemas.py`](../server/app/schemas.py), [`Procfile`](../Procfile) | Core |
| python-dotenv | Loads server environment variables from `server/.env` | [`server/app/database.py`](../server/app/database.py) | Core |
| Clerk React SDK and PyJWT | Browser sign-in and server-side session-token verification | [`client/src/App.tsx`](../client/src/App.tsx), [`server/app/auth.py`](../server/app/auth.py) | Core; requires Clerk configuration |
| Neon PostgreSQL and psycopg | Persist model runs across API restarts | [`server/app/database.py`](../server/app/database.py), [`server/migrations/001_initial.sql`](../server/migrations/001_initial.sql) | Optional; enabled by `DATABASE_URL` |
| Local JSON run files and SHA-256 audit ledger | Save run summaries and provide a hash-chain audit record | [`server/app/audit/ledger.py`](../server/app/audit/ledger.py) | Core; local filesystem is not durable on ephemeral hosting |

## AI and voice

| Tool or service | What Risk Atlas uses it for | Where to verify | Status |
| --- | --- | --- | --- |
| Gemini GenerateContent API | Structured exposure extraction, recorded-audio transcription, and underwriter question answering | [`server/app/engine/ai_provider.py`](../server/app/engine/ai_provider.py), [`server/app/engine/exposure_preview.py`](../server/app/engine/exposure_preview.py), [`server/app/engine/voice_transcription.py`](../server/app/engine/voice_transcription.py) | Selected with `RISK_ATLAS_AI_PROVIDER=gemini`; needs `GEMINI_API_KEY` |
| OpenAI Responses API and transcription API | Alternative exposure extraction and question answering; `gpt-transcribe` for recorded audio | Same provider and transcription modules | Selected with `RISK_ATLAS_AI_PROVIDER=openai`; needs `OPENAI_API_KEY` |
| Browser Web Speech recognition | Converts spoken questions to text without an audio upload when the browser supports it | [`client/src/pages/VoiceInteractionPage.tsx`](../client/src/pages/VoiceInteractionPage.tsx) | Browser-dependent |
| MediaRecorder and `getUserMedia` | Record voice when browser speech recognition is unavailable; audio goes to the authenticated API for transcription | Voice interaction page and [`client/src/features/model/VoiceExposureInput.tsx`](../client/src/features/model/VoiceExposureInput.tsx) | Browser-dependent fallback |
| Browser SpeechSynthesis | Speaks the assistant's answer and result readouts | Voice interaction page and [`client/src/components/ui/submitted-exposure-summary.tsx`](../client/src/components/ui/submitted-exposure-summary.tsx) | Browser-dependent |
| httpx and Python `urllib.request` | Server-side calls to the selected AI provider; API keys stay on the server | AI provider, exposure preview, transcription modules | Core when AI is enabled |
| Validated extraction rules | Deterministic fallback for free-text exposure when the selected AI provider is unavailable or unconfigured | [`server/app/engine/exposure_rules.py`](../server/app/engine/exposure_rules.py) | Core; labelled as rules, not AI |

The underwriter assistant receives the authenticated current portfolio run and, when available, the active property calculation. It explains calculated values and assumptions; the deterministic model computes the losses. Audio and chat history are not saved in the run record. Browser speech recognition may involve the browser vendor's speech service; availability and handling depend on the browser.

## Risk model and data processing

| Tool or library | What Risk Atlas uses it for | Where to verify |
| --- | --- | --- |
| NumPy and pandas | Exposure tables, vector calculations, financial scenarios, and simulation | [`server/app/engine/pipeline.py`](../server/app/engine/pipeline.py), [`server/app/engine/financial.py`](../server/app/engine/financial.py) |
| Pillow | Read supplied GeoTIFF proxy rasters and generate map overlay images | [`server/app/engine/hazard_validation.py`](../server/app/engine/hazard_validation.py), [`scripts/build_proxy_overlays.py`](../scripts/build_proxy_overlays.py) |
| PyYAML | Load model parameters and the assumptions register | [`server/app/engine/config_load.py`](../server/app/engine/config_load.py), [`config`](../config) |
| scikit-learn | Train a gradient-boosting surrogate for location-level AAL explanations | [`server/app/engine/shap_explainer.py`](../server/app/engine/shap_explainer.py) |
| SHAP | Explain that surrogate with TreeSHAP; a simpler contribution method is used if SHAP cannot be imported | [`server/app/engine/shap_explainer.py`](../server/app/engine/shap_explainer.py) |
| pypdf and python-docx | Extract text and source evidence from PDF and Word property offers; scanned PDFs require prior OCR | [`server/app/engine/document_review.py`](../server/app/engine/document_review.py) |
| Python `csv` module | Review submitted building-coordinate schedules | [`server/app/engine/coordinate_schedule.py`](../server/app/engine/coordinate_schedule.py) |
| Built-in model modules | Hazard lookup, fixed vulnerability matrix, deductible/limit and treaty waterfall, simulated EP, drainage sensitivity, and deterministic briefing | [`server/app/engine`](../server/app/engine), [`config/model_parameters.yaml`](../config/model_parameters.yaml) |

The supplied exposure CSV and five Nairobi pluvial proxy GeoTIFFs are project data, not third-party live services. The JRC Africa residential depth-damage table is a cited reference for assumptions; its metre-based values are not applied directly by the current categorical loss engine. See [`assumptions.md`](assumptions.md).

## Presentation, maps, and interaction

| Tool or library | What Risk Atlas uses it for | Where to verify |
| --- | --- | --- |
| Leaflet and OpenStreetMap tiles | Exposure and property maps; tile display requires network access | [`client/src/features/model/MapView.tsx`](../client/src/features/model/MapView.tsx), [`client/src/pages/ModelWorkspace.tsx`](../client/src/pages/ModelWorkspace.tsx) |
| Recharts | Portfolio, scenario, and property loss charts | [`client/src/components/ui/dashboard-4.tsx`](../client/src/components/ui/dashboard-4.tsx), [`client/src/pages/ModelWorkspace.tsx`](../client/src/pages/ModelWorkspace.tsx) |
| Spline React/runtime and hosted scene | Interactive 3D scene behind the voice microphone | [`client/src/pages/VoiceInteractionPage.tsx`](../client/src/pages/VoiceInteractionPage.tsx) |
| Lucide React | Interface icons | [`client/src/pages/DashboardPage.tsx`](../client/src/pages/DashboardPage.tsx) and other components |
| Motion, GSAP, and `@gsap/react` | Landing-page and navigation animation | [`client/src/pages/Landing.tsx`](../client/src/pages/Landing.tsx), [`client/src/components/ui/story-scroll.tsx`](../client/src/components/ui/story-scroll.tsx) |
| Radix UI, class-variance-authority, clsx, tailwind-merge | Accessible UI primitives, button variants, and class composition | [`client/src/components/ui/button.tsx`](../client/src/components/ui/button.tsx), [`client/src/lib/utils.ts`](../client/src/lib/utils.ts) |

## Configuration and development tools

| Tool | Purpose | Command or setting |
| --- | --- | --- |
| npm and Node.js | Install, build, lint, and test the frontend | `cd client && npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm test` |
| Python virtual environment and pip | Install backend dependencies | `python -m venv server/.venv`, `server/.venv/bin/pip install -r server/requirements.txt` |
| Uvicorn | Run the API locally | `PYTHONPATH=server server/.venv/bin/python -m uvicorn app.main:app --reload --port 8000` |
| Python `unittest` and Node test runner | Backend and frontend tests | `PYTHONPATH=server server/.venv/bin/python -m unittest discover -s server/tests`, `cd client && npm test` |
| ESLint and TypeScript compiler | Frontend lint and type validation | `cd client && npm run lint`, `cd client && npm run build` |
| Heroku `Procfile` | Documented backend deployment entry point | [`Procfile`](../Procfile), [`README.md`](../README.md) |

Server configuration names are listed in [`server/.env.example`](../server/.env.example); browser configuration names are in [`client/.env.example`](../client/.env.example). `RISK_ATLAS_AI_PROVIDER` selects Gemini or OpenAI. `RISK_ATLAS_GEMINI_MODEL` and `RISK_ATLAS_OPENAI_MODEL` select the model for the corresponding provider. `RISK_ATLAS_API_TARGET` controls Vite's local proxy; `VITE_API_BASE_URL` controls browser requests to a hosted API. Keep API keys and database credentials only in server-side configuration.
