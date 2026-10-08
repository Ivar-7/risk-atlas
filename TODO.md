# Risk Atlas — important work checklist

## Required for the Team A demo

- [x] **2.** Demonstrate a genuine AI-driven change to the CAT result. The live `gpt-6-luna` extraction and reviewed run are recorded in [the demo evidence](docs/live_ai_demo_evidence.json): 25 Kibera buildings added KES 20,000,000 TIV and raised the illustrative 1-in-100 gross insured loss by KES 1,768,524. The run retains the offer, reviewed groups, model, response ID, and comparison with the unchanged starter portfolio.
- [x] **3.** Correct and verify the vulnerability source. The [JRC Africa residential table](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC105688/global_flood_depth-damage_functions__10042017.pdf) gives 0.5 m → 22% and 1 m → 38%, while the assumptions register claims 0.1 m → 5% and 1 m → 40%. Reconcile the implemented curve with the published points, cite the exact table, and label the class multipliers/caps as adaptations.
- [x] **4.** Apply documented property deductible/limit terms to produce a gross insured portfolio EP curve, show ground-up loss separately, and keep treaty layers outside the Team A scope.
- [x] **5.** Validate the drainage correction with evidence independent of the hotspot centres used to construct it, or present its loss uplift strictly as an unvalidated sensitivity. The current rule raises scores around the 12 proxy misses by construction, so those same hotspots cannot demonstrate improved predictive accuracy.

## Model integrity and delivery

- [x] **6.** Validate imported exposure before a run: Nairobi/raster coverage, finite coordinates, hazard scores within 0–1, and supported housing classes.
- [x] **7.** Protect model, preview, document, audit, and run endpoints with server-side Clerk session verification. Hosted deployments must configure the Clerk issuer and trusted origins.
- [x] **8.** Prepare the short submission note and a reproducible controlled demo run covering data sources, synthetic/proxy/return-period/depth assumptions, vulnerability, AI input/output and loss effect, and the 12/24 hotspot limitation. The dashboard’s first view identifies the portfolio as synthetic and the EP curve as illustrative.
