# Nairobi flood CAT prototype — submission note

## Data and model

The portfolio is the starter kit's 600 **synthetic** Nairobi buildings (KES 6,363,470,000 total insured value), not a cedant or Kenya Re portfolio. The five supplied GeoTIFFs are a constructed pluvial susceptibility proxy based on terrain and mapped river/stream signals, not measured flood depth. The starter kit provides 24 approximate coordinates for 37 named flood-prone areas; the common proxy flags 12 of those 24 centres.

For each building and tier, the model converts the 0–1 susceptibility score to an illustrative depth by multiplying it by 4 m. It applies the [JRC Africa residential depth-damage table](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC105688/global_flood_depth-damage_functions__10042017.pdf#page=16) with documented construction-class depth multipliers and caps. Those class adjustments are assumptions, not Kenya claims calibration. Ground-up loss is damage ratio × building TIV. Gross insured loss applies each building's assumed deductible and policy limit, then sums payouts across the portfolio. The workspace sets those terms as percentages of each building's TIV; the starter portfolio contains no verified policy terms. The default 0% deductible and 100% limit leave gross loss equal to ground-up loss. Treaty recovery and net loss are not part of the portfolio curve.

The five source tiers have no measured event frequencies. The illustrative mapping is extreme=10, severe=25, moderate=50, occasional=100 and common=250 years. The widest mask is mapped to the rarest event to produce increasing losses. The resulting exceedance curve and integrated annual average loss depend on this assumption and are unsuitable for underwriting without calibration. The optional drainage uplift is a deterministic, **unvalidated sensitivity** around proxy-missed hotspot centres. Its effect is shown against the same model without uplift; the centres used to construct it cannot independently validate its accuracy.

## AI contribution

When `OPENAI_API_KEY` is configured, the exposure preview uses a model to extract explicitly stated building count, class, place and value per building from a synthetic residential offer. The underwriter reviews those rows before submission. The saved run records the offer text, extracted groups, returned model and response ID, review time, and a comparison against the same portfolio without the added rows. The rows change TIV and the loss curve; a deterministic rules preview is explicitly labelled as non-AI. [The demo](ai_exposure_demo.md) describes the workflow, and [the live evidence](live_ai_demo_evidence.json) records a `gpt-6-luna` extraction and reviewed local API run. Database persistence was mocked for this demo to avoid adding a test run to the configured shared database.

## Limits

The hazard layer misses drainage-driven flooding, as the 12/24 centre check illustrates. Approximate neighbourhood centres can also miss nearby flooded streets. Flood depths, frequencies, class vulnerability adjustments, policy terms and any new exposure locations are assumptions. No real client portfolio, measured pluvial depths, local claims calibration or independent validation of the drainage uplift is included. Model outputs should be presented as prototype estimates.
