# Risk Atlas assumptions

The portfolio contains 600 synthetic Nairobi buildings. It is not a Kenya Re or cedant book. Named hotspots are sourced from the starter kit; the five hazard scores are relative susceptibility proxies, not observed flood depths or calibrated event frequencies.

The live model in `/app/` uses `config/model_parameters.yaml` and `config/assumptions_register.yaml` as its authoritative parameter and provenance records. It converts proxy score to illustrative depth by multiplying by 4 m, then applies JRC Africa residential depth-damage anchors with documented adjustments and caps for the four housing classes. Loss is ground-up property loss before policy or treaty terms.

| Starter proxy mask | Assumed return period |
| --- | ---: |
| extreme (narrowest) | 5 years |
| severe | 10 years |
| moderate | 25 years |
| occasional | 100 years |
| common (widest) | 250 years |

The mask names describe the supplied files, not the assigned frequency. Wider masks contain more locations and produce larger losses, so they are mapped to rarer events for a monotone illustrative exceedance probability curve. This mapping is a modeling choice, not rainfall frequency evidence. Annual average loss is integrated from that discrete curve.

The optional drainage correction increases proxy scores near missed hotspots using a distance kernel. Free-text ingestion adds synthetic exposure rows from supported count, class, place, and insured-value patterns. SHAP explains a surrogate of location annual average loss; the physics-based loss calculation remains authoritative.

The `/dashboard/` overview and `/app/` workspace use the same latest API run. The dashboard reads scenario losses, location scores, and class data from that run; OpenStreetMap only supplies the basemap. Neither is suitable for underwriting without calibrated hazard, vulnerability, frequency, and actual insured exposure data.
