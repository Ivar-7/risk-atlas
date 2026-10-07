/**
 * Single source of truth for every word on the Risk Atlas landing page.
 *
 * Teammates: edit copy here. Components in src/components/landing/ import from
 * here and contain no prose of their own (only label fragments that describe
 * chart geometry).
 *
 * HONESTY RULES — keep these when editing:
 *  - The portfolio is SYNTHETIC (600 generated buildings). Never add real
 *    client figures.
 *  - The hazard layer is a PROXY susceptibility score (0-1) built from terrain
 *    elevation, terrain depressions and distance to OpenStreetMap rivers. It is
 *    NOT a measured flood depth in metres. Never present it as one.
 *  - Wherever a result number would go, use the placeholder `KES —` (or the
 *    `ILLUSTRATIVE` label) rather than an invented value.
 */

export const PLACEHOLDER = 'KES —'

export const brand = {
  wordmark: 'risk atlas',
  tagline: 'Nairobi pluvial flood model',
  githubUrl: 'https://github.com/Lenny-Lewis/risk-atlas',
  // Public-facing live model workspace.
  modelHref: '/app/',
  homeHref: '/',
  assumptionsUrl: 'https://github.com/Lenny-Lewis/risk-atlas/blob/main/docs/assumptions.md',
  hackathon: 'Built for the Kenya Re hackathon',
  disclaimer:
    'Prototype using synthetic exposure data and a proxy hazard layer. Not for underwriting decisions.',
}

export const navLinks = [
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Outputs', href: '#outputs' },
  { label: 'AI layer', href: '#ai-layer' },
  { label: 'Validation', href: '#validation' },
  { label: 'Methodology', href: '#methodology' },
]

export const problem = {
  id: 'problem',
  eyebrow: 'The problem',
  title: 'Why urban flood risk is hard to price',
  paragraphs: [
    'Nairobi’s pluvial flood risk is barely priced because the hazard itself is barely mapped. There is no public dataset of rainfall-driven flood depth for the city — no open street-level depth rasters, and no curated loss database for Kenyan buildings.',
    'A model that claims a defensible flood curve for Nairobi therefore has to start from a proxy. Risk Atlas derives a 0–1 susceptibility score for every location from terrain elevation, terrain depressions and distance to OpenStreetMap rivers, then bands that score into five severity tiers.',
    'The proxy is transparent and reproducible. It is not a measurement, and both this page and the app say so. Where topography and river proximity drive risk — Eastlands, along the Nairobi River — the signal is useful. The model workspace can apply an explicit drainage correction where the terrain proxy misses named hotspots.',
  ],
  note: 'These cards are qualitative statements, not measurements. No figures are attached to them on purpose.',
  cards: [
    {
      icon: 'buildingGrowth',
      title: 'Rapid urban growth',
      body: 'Nairobi keeps building outward faster than drainage and retention capacity expand, so the same storm does more damage each decade.',
    },
    {
      icon: 'riverCorridor',
      title: 'Informal settlements on river corridors',
      body: 'The lowest-value, most damage-prone housing sits along the Nairobi River — exactly where terrain and distance-to-water score highest.',
    },
    {
      icon: 'noData',
      title: 'No public pluvial depth maps',
      body: 'No open rainfall-driven depth dataset exists for Nairobi, which is why a proxy hazard layer had to be built before any loss figure could exist.',
    },
  ],
}

export const howItWorks = {
  id: 'how-it-works',
  eyebrow: 'How it works',
  title: 'Four stages, one number out',
  lede: 'Hazard decides where and how bad. Exposure decides what is there. The financial engine turns both into one loss figure per scenario.',
  steps: [
    {
      icon: 'hazard',
      title: 'Hazard',
      body: 'Five severity tiers, from common to extreme, derived from a 0–1 susceptibility proxy built on terrain and rivers.',
    },
    {
      icon: 'vulnerability',
      title: 'Vulnerability',
      body: 'Depth-damage curves by construction class: informal iron sheet, semi-permanent, permanent masonry, and concrete / RCC.',
    },
    {
      icon: 'exposure',
      title: 'Exposure',
      body: '600 synthetic buildings with insured values in KES, generated for the hackathon rather than taken from any client.',
    },
    {
      icon: 'financial',
      title: 'Financial engine',
      body: 'A loss per scenario, summed across the portfolio, which is what produces the exceedance probability curve.',
    },
  ],
}

export const outputs = {
  id: 'outputs',
  eyebrow: 'Key outputs',
  title: 'What the model hands you',
  lede: 'Three views an underwriter asks for: the curve, the class mix, and the number at each return period. Everything below is illustrative until you run the model.',
  primaryCta: 'Open the live model',
  cards: {
    epCurve: {
      title: 'Exceedance probability curve',
      description: 'Portfolio loss against return period. Loss rises as the return period lengthens, because rarer storms are assumed to be more severe.',
      axisX: 'Return period (years)',
      axisY: 'Portfolio loss (KES)',
      // Illustrative shape only. These tick positions match the five mapped
      // tiers; the y values carry no units on purpose.
      xTicks: [
        { label: '1-in-5', x: 78 },
        { label: '1-in-10', x: 162 },
        { label: '1-in-25', x: 248 },
        { label: '1-in-100', x: 332 },
        { label: '1-in-250', x: 486 },
      ],
    },
    lossByClass: {
      title: 'Loss by housing class',
      description: 'Where damage concentrates. Bar lengths are placeholders so the card is readable in context — the model computes the real split.',
      axisX: 'Relative loss (placeholder)',
      classes: [
        { label: 'Informal iron sheet', width: 100, color: '#67e8f9' },
        { label: 'Semi-permanent', width: 62, color: '#a7f3d0' },
        { label: 'Permanent masonry', width: 34, color: '#fcd34d' },
        { label: 'Concrete / RCC', width: 16, color: '#c4b5fd' },
      ],
    },
    returnPeriods: {
      title: 'Loss at key return periods',
      description: 'The four points most often quoted in a reinsurance conversation. Placeholders until the model is run.',
      columns: ['Return period', 'Portfolio loss', 'Buildings affected'],
      rows: [
        { label: '1-in-10', loss: PLACEHOLDER, affected: '—' },
        { label: '1-in-25', loss: PLACEHOLDER, affected: '—' },
        { label: '1-in-100', loss: PLACEHOLDER, affected: '—' },
        { label: '1-in-250', loss: PLACEHOLDER, affected: '—' },
      ],
      footnote:
        'These are static placeholders. The live workspace calculates all five assumed return periods, including 1-in-250.',
    },
  },
}

export const aiLayer = {
  id: 'ai-layer',
  eyebrow: 'AI intelligence layer',
  title: 'AI that changes the inputs, not just the narration',
  lede: 'Drainage correction and free-text exposure change the model inputs and losses. The briefing and SHAP views explain the resulting run.',
  emphasis:
    'Run the model with correction on or off to see the loss delta. Free-text rows change the insured value and loss curve. Explanations describe the result; they do not alter it.',
  features: [
    {
      icon: 'drainage',
      title: 'Drainage-gap correction',
      body: 'A distance-based uplift around proxy-missed hotspots changes susceptibility before the loss calculation. Toggle it in the model workspace to compare with the uncorrected proxy.',
    },
    {
      icon: 'ingest',
      title: 'Free-text exposure ingestion',
      body: 'Enter a count, housing class, named place, and value in plain language. The parser adds synthetic locations to the next run, changing insured value and the loss curve.',
    },
    {
      icon: 'briefing',
      title: 'Briefing and explanation',
      body: 'The workspace generates a run summary and shows global and location-level SHAP contributions for a surrogate of annual average loss. The physics loss remains the authoritative estimate.',
    },
  ],
  mock: {
    inputLabel: 'Underwriter types',
    input:
      '25 informal iron-sheet houses in Kibera, KES 800000 each',
    outputLabel: 'Model proposes rows',
    outputRows: [
      { label: '25 × Informal iron sheet', meta: 'Kibera · synthetic additions', value: 'KES —' },
    ],
    note: 'Static example. Enter this text and press Run model in the workspace to add the parsed synthetic locations.',
  },
}

export const validation = {
  id: 'validation',
  eyebrow: 'Validation and honest limits',
  title: 'Where the proxy holds, and where it goes quiet',
  lede: 'The susceptibility layer was scored against 24 government-named Nairobi flood hotspots. It flagged 12 of them and missed 12. Both halves matter.',
  catches: {
    title: 'What it catches',
    body: 'The 12 flagged hotspots are mostly Eastlands informal settlements along the Nairobi River — low-lying ground, close to mapped watercourses, exactly the conditions a terrain-and-distance proxy is supposed to pick up.',
  },
  misses: {
    title: 'What it misses',
    body: 'The 12 missed hotspots include Kibera, Westlands and Lavington. Those areas flood because drainage is overwhelmed — blocked culverts, undersized pipes, hard surfaces with nowhere for water to go — not because they sit near a river or in a dip. Terrain elevation and distance to rivers are structurally blind to that mechanism.',
  },
  note: 'Next improvement: join drainage network data (pipe capacity, culverts, flood storage) to the terrain proxy so the model can score the overload mechanism directly.',
}

export const dataTransparency = {
  id: 'data',
  eyebrow: 'Data and transparency',
  title: 'Every file, and exactly what kind of data it is',
  lede: 'Real, proxy and synthetic are used precisely here so nobody has to guess later.',
  legend: {
    real: { label: 'Real', hint: 'Measured or published data, used as given.' },
    proxy: { label: 'Proxy', hint: 'Derived from real data, but the interpretation is an assumption.' },
    synthetic: { label: 'Synthetic', hint: 'Generated for this prototype. No real-world counterpart.' },
  },
  columns: ['File', 'What it is', 'Real or synthetic'],
  rows: [
    {
      file: 'nairobi_pluvial_proxy_common.tif',
      what: 'Terrain-derived susceptibility raster, “common” severity tier (GeoTIFF)',
      status: 'proxy',
    },
    {
      file: 'nairobi_pluvial_proxy_occasional.tif',
      what: 'Terrain-derived susceptibility raster, “occasional” severity tier (GeoTIFF)',
      status: 'proxy',
    },
    {
      file: 'nairobi_pluvial_proxy_moderate.tif',
      what: 'Terrain-derived susceptibility raster, “moderate” severity tier (GeoTIFF)',
      status: 'proxy',
    },
    {
      file: 'nairobi_pluvial_proxy_severe.tif',
      what: 'Terrain-derived susceptibility raster, “severe” severity tier (GeoTIFF)',
      status: 'proxy',
    },
    {
      file: 'nairobi_pluvial_proxy_extreme.tif',
      what: 'Terrain-derived susceptibility raster, “extreme” severity tier (GeoTIFF)',
      status: 'proxy',
    },
    {
      file: 'nairobi_hotspots_geocoded.csv',
      what: 'Government-named flood hotspots geocoded to coordinates — 24 of 37 names matched',
      status: 'real',
    },
    {
      file: 'exposure_nairobi_synthetic.csv',
      what: 'Generated property portfolio with construction class and insured value in KES',
      status: 'synthetic',
    },
    {
      file: 'exposure_nairobi_with_hazard.csv',
      what: 'The same synthetic portfolio with the five susceptibility scores joined on',
      status: 'synthetic',
    },
  ],
  note: 'The hazard rasters are built from real terrain and real OpenStreetMap river geometry. What is an assumption is reading a susceptibility score as flood severity — that step is the proxy, and it is labelled as one everywhere it appears.',
}

export const methodology = {
  id: 'methodology',
  eyebrow: 'Methodology and assumptions',
  title: 'The parts you should argue with',
  lede: 'Four decisions carry the model. None of them is settled science, so all four are written down and editable.',
  items: [
    {
      title: 'Score to severity mapping',
      body: 'Each location has five 0–1 susceptibility scores from the starter-kit proxy masks. These are relative signals from terrain and mapped rivers, not observed flood depths. The model converts scores to illustrative depth using an explicit 4 m scale assumption.',
    },
    {
      title: 'Tier to return period mapping',
      body: 'Placeholder values used only to give the curve a plausible shape. They are not derived from a rainfall frequency analysis for Nairobi and must be replaced with hydrologically defensible return periods before any real use.',
      tableCaption: 'Current placeholder mapping',
      tableColumns: ['Severity tier', 'Assumed return period'],
      tableRows: [
        { label: 'Common', value: '1-in-250' },
        { label: 'Occasional', value: '1-in-100' },
        { label: 'Moderate', value: '1-in-25' },
        { label: 'Severe', value: '1-in-10' },
        { label: 'Extreme', value: '1-in-5' },
      ],
    },
    {
      title: 'Vulnerability curve sources',
      body: 'Depth-damage functions are adapted from the JRC global depth-damage curves, then adjusted per construction class: informal iron sheet, semi-permanent, permanent masonry, and concrete / RCC. The adjustments are conservative and untested against Kenyan claims data. Damage caps in the app are demo assumptions.',
    },
    {
      title: 'Scope limits',
      body: 'Ground-up, insured-value loss only. Not modelled: business interruption, liability, inflation or currency effects, perils other than pluvial surface water, and reinsurance treaty structure. The model stops at gross loss to the portfolio.',
    },
  ],
  docsLinkLabel: 'Read docs/assumptions.md on GitHub',
}

export const team = {
  id: 'team',
  eyebrow: 'Team',
  title: 'Three people, one weekend',
  members: [
    { initials: 'TN', name: 'Team member name', role: 'Model & API', blurb: 'Hazard tiers, vulnerability curves, the financial engine.' },
    { initials: 'TN', name: 'Team member name', role: 'Client', blurb: 'Landing page, dashboard, and everything an underwriter touches.' },
    { initials: 'TN', name: 'Team member name', role: 'Data & AI', blurb: 'Rasters, geocoding, ingestion and the underwriter briefing.' },
  ],
  note: 'Names and photos are placeholders — swap them in src/content/landing.ts.',
}

export const cta = {
  eyebrow: 'Get started',
  title: 'See the curve, not just the map',
  body: 'Open the live model to walk through the five severity tiers, inspect the synthetic portfolio, and read every assumption behind each number.',
  primaryLabel: 'Open the live model',
  secondaryLabel: 'View on GitHub',
}

export const footer = {
  disclaimerTitle: 'Disclaimer',
  navLabel: 'Landing page',
}
