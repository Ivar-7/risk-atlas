# Model analysis workflow

The portfolio result is calculated by deterministic hazard, vulnerability, and financial engines. Gemini or OpenAI can help extract optional exposure from underwriter text, but the extracted groups must be reviewed before a run. The voice assistant reads completed results; it does not calculate them.

## Portfolio run

```mermaid
flowchart TD
    A["Run request and selected controls"] --> B["Load model parameters and assumptions"]
    C["Exposure CSV, hotspot CSV, and hazard scores"] --> D["Validate portfolio and map source raster masks to scenario tiers"]
    E["Optional underwriter text"] --> F["AI or rules exposure preview"]
    F --> G["User reviews extracted groups and optional coordinate schedule"]
    G --> H["Create added locations; sample mapped raster scores"]
    B --> I["Combine starter and reviewed added exposure; attach nearest hotspots"]
    D --> I
    H --> I
    A --> I

    I --> J["Baseline losses without drainage correction"]
    I --> K["Apply selected drainage correction to hazard scores"]
    I --> L["Always-on drainage sensitivity branch"]
    K --> M["Vulnerability: housing class × scenario damage ratio when hazard score is positive"]
    M --> N["Ground-up loss per location = damage ratio × TIV"]
    N --> O["Property deductible and policy limit → gross insured loss"]
    O --> P["Aggregate by scenario; quota share then optional catastrophe XOL → net loss"]
    P --> Q["Scenario EP curve and gross/net portfolio AAL"]
    O --> R["Location AAL and housing-class/hotspot summaries"]

    J --> S["Baseline versus drainage sensitivity"]
    L --> S
    O --> S
    I --> T["Starter-only versus expanded portfolio comparison"]
    T --> U["Assemble final run result"]
    Q --> U
    R --> U
    S --> U
    Q --> V["Synthetic gross EP simulation and frequency sensitivity"]
    V --> U
    R --> W["SHAP surrogate explanations of location AAL"]
    W --> U
    C --> X["Hotspot detection check against source mask"]
    X --> U
    U --> Y["Deterministic underwriter briefing"]
    Y --> Z["Save run and audit record; return dashboard, map, charts, and exports"]
    Z --> AA["Optional voice Q&A uses completed run context"]
```

The five displayed scenarios are **common: 1-in-10**, **occasional: 1-in-25**, **moderate: 1-in-50**, **severe: 1-in-100**, and **extreme: 1-in-250**. Their return periods are assumptions. The supplied raster mask names run in the opposite footprint order, so the source mask mapping is `extreme → common`, `severe → occasional`, `moderate → moderate`, `occasional → severe`, and `common → extreme`. A positive mapped score activates the fixed class and scenario damage ratio; the score is a constructed flood proxy, not measured water depth.

The drainage branch is an unvalidated sensitivity. The simulated EP curve uses gross scenario loss anchors; SHAP explains a fitted surrogate of location AAL. Neither changes the authoritative scenario loss calculation.

## Separate property-document calculation

This path produces an illustrative result for one document and does **not** feed the portfolio run or its EP curve.

```mermaid
flowchart LR
    A["Upload PDF or DOCX"] --> B["Extract text and cited evidence"]
    B --> C["Parse coordinates, property class, and stated TIV"]
    C --> D["Sample mapped hazard proxy at document coordinates"]
    D --> E["Illustrative scenario damage ratio × stated TIV"]
    E --> F["Underwriter reviews document and financial terms"]
    F --> G["Single-occurrence calculator: deductible → policy limit → quota share → optional cat XOL"]
    G --> H["Property gross and net loss result"]
```

Implementation: [`pipeline.py`](../server/app/engine/pipeline.py) orchestrates portfolio runs; [`ingestion.py`](../server/app/engine/ingestion.py), [`drainage_rule.py`](../server/app/engine/drainage_rule.py), [`vulnerability.py`](../server/app/engine/vulnerability.py), and [`financial.py`](../server/app/engine/financial.py) calculate the core stages. [`document_review.py`](../server/app/engine/document_review.py) and [`loss_terms.py`](../server/app/engine/loss_terms.py) handle the separate property path. Scenario mapping and assumptions are in [`model_parameters.yaml`](../config/model_parameters.yaml).
