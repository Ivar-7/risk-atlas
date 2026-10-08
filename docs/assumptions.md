# Risk Atlas assumptions

The portfolio contains 600 synthetic Nairobi buildings. It is not a Kenya Re or cedant book. Named hotspots are sourced from the starter kit; the five hazard scores are relative susceptibility proxies, not observed flood depths or calibrated event frequencies.

The live model in `/dashboard/` uses `config/model_parameters.yaml` and `config/assumptions_register.yaml` as its authoritative parameter and provenance records. It converts proxy score to illustrative depth by multiplying by 4 m, then applies JRC Africa residential depth-damage anchors with documented adjustments and caps for the four housing classes. Ground-up property loss is damage ratio × building TIV. Gross insured loss is `min(max(ground-up loss − deductible, 0), policy limit)` for each building, summed across the portfolio. The deductible and limit are assumed percentages of each building's TIV, selected in the workspace; the default 0% deductible and 100% limit leave gross equal to ground-up. These uniform terms are synthetic, not verified contracts. No reinsurance recovery or net loss is included in the portfolio EP curve.

The vulnerability source is Huizinga, de Moel & Szewczyk (2017), *Global flood depth-damage functions*, EUR 28552 EN, [Table 3-1, printed p. 12 (PDF p. 16)](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC105688/global_flood_depth-damage_functions__10042017.pdf#page=16), “Average continental damage function for Africa – residential buildings.” Its depth/damage-factor pairs are 0 m/0%, 0.5 m/22%, 1 m/38%, 1.5 m/53%, 2 m/64%, 3 m/82%, 4 m/90%, 5 m/96%, and 6 m/100%. The model uses these exact points, linearly interpolates between them, and clamps outside 0–6 m. The former 0.1 m/5% and 1 m/40% claims and exponential fit were not the published table values.

The four construction curves multiply the illustrative depth before reading the JRC curve, then cap the result: informal iron sheet 1.45×/95%, semi-permanent 1.10×/90%, permanent masonry 0.85×/85%, and concrete RCC 0.55×/70%. These multipliers, caps, and the interpolation rule are **assumed model adaptations**; the JRC table does not provide class-specific values. The JRC residential function includes contents/inventory in its underlying source values, so applying its fraction to the synthetic building TIV is also an uncalibrated simplification.

| Starter proxy mask | Assumed return period |
| --- | ---: |
| extreme (narrowest) | 10 years |
| severe | 25 years |
| moderate | 50 years |
| occasional | 100 years |
| common (widest) | 250 years |

The mask names describe the supplied files, not the assigned frequency. Wider masks contain more locations and produce larger losses, so they are mapped to rarer events for a monotone illustrative exceedance probability curve. This mapping is a modeling choice, not rainfall frequency evidence. Annual average loss is integrated from that discrete curve.

The optional drainage rule increases proxy scores near the 12 common-proxy-missed named hotspot centres using a deterministic distance kernel. It is disabled in the default run. The uplifted run is an **unvalidated sensitivity**: the same centres were used to build the rule, so improved scores or losses at those centres cannot demonstrate predictive accuracy. No independent flood observations, site-level claims, or drainage-network evidence is supplied for validation. The comparison uses identical exposure and policy terms, with and without the rule; its loss difference is an assumption-driven scenario effect, not an estimated correction to real losses. The corrected scores are constrained to increase with assumed event rarity. The common raster detects 12 of 24 approximate geocoded hotspot centres, with 13 of 37 county-named areas lacking coordinates in the kit. Free-text ingestion uses strict rules unless `OPENAI_API_KEY` enables model-backed structured extraction. Every accepted exposure group is previewed and creates only synthetic rows. SHAP explains a surrogate of location annual average loss; the physics-based loss calculation remains authoritative.

The supplied exposure CSVs now total KES 6,363,470,000, matching the data dictionary. Every row is checked against floor area × cost per square metre, within KES 2,500 of rounding. The dashboard's depth-scale and return-period sensitivity values are alternate assumptions, not uncertainty bounds.

The `/dashboard/` overview and `/app/` workspace use the same latest API run. The dashboard reads scenario losses, location scores, and class data from that run; OpenStreetMap only supplies the basemap. Neither is suitable for underwriting without calibrated hazard, vulnerability, frequency, and actual insured exposure data.
