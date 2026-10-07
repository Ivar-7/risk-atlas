# TODO: AI-Powered Flood CAT Model, Nairobi Urban Flood Challenge (Team A)

Pipeline: Hazard → Vulnerability → Exposure → Financial engine → Loss / return-period (EP) curve

Problem: Risk we can't see cannot be priced. No locally calibrated flood CAT model for Kenya, so flood risk is priced by underwriter judgement and broad global hazard layers. Result: unexpected losses and poor pricing.

Solution: AI-powered flood risk model for Kenya. Real flood data insight → AI risk model → underwriter.

---

## 1. Data

- [ ] Load starter kit from `data/team_a_nairobi/`
  - [ ] `nairobi_pluvial_proxy_{common,occasional,moderate,severe,extreme}.tif` (5 severity rasters, score 0–1)
  - [ ] `nairobi_hotspots_geocoded.csv` (24 hotspots, used to validate the proxy)
  - [ ] `exposure_nairobi_with_hazard.csv` (600 synthetic buildings, hazard scores attached; recommended start)
  - [ ] `exposure_nairobi_synthetic.csv` (same buildings, no hazard columns)
- [ ] Data ingestion step (notes: data ingestion, database)
- [ ] Label every dataset as real, proxy or synthetic

## 2. Hazard: where will an event occur and at what severity?

- [ ] Capture rare events like flooding: where and how severe
- [ ] Geo of insured assets, wider area look, flood hazard zones
- [ ] Depth and rainfall intensity
- [ ] Decide how the 0–1 susceptibility score represents severity (keep as 0–1, or convert to metres, e.g. score × 4 m)
- [ ] Result: severity dataset for all five tiers, with a written explanation of what the values mean
- [ ] Assign a return period to each of the five tiers and state the assumption
- [ ] Event frequency: Poisson distribution
- [ ] Check proxy against the 24 hotspots (proxy flags 12 of 24)
- [ ] Improve the hazard layer using AI, targeting the drainage-driven flooding the proxy misses (e.g. Kibera, Westlands, Lavington)
  - [ ] Use an LLM to identify extra signals (more hotspot names, drainage infrastructure reports, informal-settlement boundaries)
  - [ ] Turn unstructured hazard-related text into structured model input
- [ ] Stretch only, not expected: full physically based pluvial hydrology

## 3. Vulnerability (depth-damage / damage function)

- [ ] Use JRC / Huizinga depth-damage functions as the reference
- [ ] Build the damage function: damage near zero at low severity, rising through the middle, capped at about 80–95%
- [ ] Separate parameters per construction type (e.g. informal iron-sheet vs concrete/RCC)
- [ ] Choose form: sigmoid or piecewise curve, or damage tiers directly from the five severity categories
- [ ] State source and where your parameters differ from it
- [ ] Result: documented vulnerability function and vulnerability matrix (severity + construction type → damage ratio)
- [ ] Optional AI: use an LLM to find, compare or adapt published curve parameters, showing the reasoning

## 4. Exposure

- [ ] Use the 600-building synthetic portfolio (or generate/extend your own), clearly labelled synthetic
- [ ] Exposure = assets or buildings in the affected area and their worth
- [ ] Embakasi example
- [ ] Result: structured portfolio with characteristics, values, and the fields needed to link to hazard and vulnerability
- [ ] AI feature: free-text portfolio description → LLM → structured exposure rows matching the exposure file, then damage ratio and expected loss by return period
- [ ] AI running on unstructured documents, building material

## 5. Financial engine

- [ ] Per building: look up severity at each tier → apply vulnerability → damage ratio → × insured value = building loss
- [ ] Sum building losses to portfolio loss per scenario
- [ ] Repeat across return periods / tiers
- [ ] Result: portfolio loss per scenario and return-period EP curve
- [ ] Estimated loss distribution
- [ ] Aggregate annual loss
- [ ] Total sum insured (total sum ≤ check, per notes)
- [ ] Risk information: maximum loss, scenario stress analysis
- [ ] Portfolio: effect of accepting new applications
- [ ] Use Oasis as the financial engine (per notes)
- [ ] Option: direct return-period interpolation, or Monte Carlo year-loss simulation
- [ ] Out of scope: reinsurance treaty structuring, layers, net-of-reinsurance loss

## 6. AI layer (required, must materially change the output)

- [ ] Pick at least one (or propose your own):
  - [ ] Free-text exposure ingestion
  - [ ] Natural-language risk briefing from model output (EP curve, statistics, largest losses)
  - [ ] AI-assisted vulnerability research
  - [ ] Hazard layer improvement
- [ ] Advice generation
- [ ] Explainable AI (LIME, SHAP): complete explainable AI system
- [ ] AI frameworks / open-source frameworks, LLMs
- [ ] Interactive modelling
- [ ] Keep evidence of what the AI actually contributed
- [ ] Secure by design, sustainability, explainability

## 7. Results interface (end-to-end system for underwriters)

- [ ] Dashboards, summaries, tables
- [ ] Must be understandable by a non-modeller in under 2 minutes
- [ ] Minimum contents:
  - [ ] Total exposure
  - [ ] Loss at key return periods
  - [ ] EP curve
  - [ ] Breakdown by construction / housing class
  - [ ] Output from the AI feature
- [ ] Show which information is real data and which is an assumption
- [ ] Explain terminology in the interface
- [ ] Workflow: data → model → output (interactive)
- [ ] Output supports financial decisions and risk transfer (minimise and spread risk)
- [ ] Judging emphasis in notes: creativity, UI, completeness

## 8. Assumptions and documentation

- [ ] State every assumption and every use of synthetic data
- [ ] Do not present placeholder numbers as real observations
- [ ] Data sources
- [ ] AI feature description
- [ ] State model limitations honestly
- [ ] Auditing / risk analysis

## 9. Presentation and demo

- [ ] 5 slides, 10 minutes
  - [ ] Problem statement (summary)
  - [ ] Solution (overview)
  - [ ] Solution presentation (3 slides, per notes)
  - [ ] Tools and technologies used
  - [ ] Workflow diagrams
  - [ ] Team
- [ ] Nepal example
- [ ] Demo the solution end to end
- [ ] Align with objectives
- [ ] Show outputs (decision-making)
- [ ] Link to demo
- [ ] Written note: data sources, assumptions, AI feature
