export const brand = {
  wordmark: 'Risk Atlas',
  homeHref: '/',
  githubUrl: 'https://github.com/Lenny-Lewis/risk-atlas',
  assumptionsUrl: 'https://github.com/Lenny-Lewis/risk-atlas/blob/main/docs/assumptions.md',
  disclaimer: 'Prototype using synthetic exposure data and a proxy hazard layer. Not for underwriting decisions.',
}

export const hero = {
  heading: ['Map the flood.', 'Measure the risk.'],
  subLines: [
    'Explore flood susceptibility across Nairobi,',
    'see how it intersects synthetic property exposure,',
    'and trace assumed damage into illustrative loss.',
  ],
  actions: [
    { label: 'Open dashboard', href: '/dashboard/' },
    { label: 'Explore scenarios', href: '/dashboard/#loss-curve' },
  ],
}

export const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'What you get', href: '#outputs' },
  { label: 'Data and limits', href: '#data' },
]

export const pipeline = [
  { title: 'Hazard', body: 'Score flood susceptibility across Nairobi using terrain and mapped rivers.' },
  { title: 'Vulnerability', body: 'Apply damage assumptions for each housing class.' },
  { title: 'Exposure', body: 'Place a synthetic building portfolio against the hazard layer.' },
  { title: 'Financial engine', body: 'Estimate scenario losses and assemble an EP curve.' },
]

export const outputCards = [
  { title: 'EP curve', body: 'See estimated loss against return period for the synthetic portfolio.' },
  { title: 'Loss by housing class', body: 'Compare modelled loss across building types.' },
  { title: 'AI risk briefing and free-text exposure input', body: 'Read a concise risk summary and add exposure in plain language.' },
]

export const dataAndLimits = {
  real: '24 government-named flood hotspots are used to check the hazard proxy.',
  synthetic: 'The model uses a generated portfolio of 600 Nairobi buildings.',
  proxy: 'A 0 to 1 susceptibility score stands in for measured flood depth.',
  limits: 'The terrain and river proxy can miss drainage-driven flooding in places such as Kibera and Westlands.',
}

export const footerStory = {
  introduction: {
    label: '01 — What Risk Atlas does',
    heading: ['Flood risk,', 'in view.'],
    body: 'Risk Atlas maps Nairobi flood susceptibility, places synthetic buildings against it, and estimates illustrative property loss.',
  },
  model: {
    label: '02 — The model',
    heading: ['From map', 'to loss.'],
    body: 'Four linked stages make each result traceable from the hazard layer to the loss curve.',
    stages: [
      { title: 'Hazard', body: 'Terrain and river data form a relative flood susceptibility proxy.' },
      { title: 'Vulnerability', body: 'Damage assumptions vary by housing class.' },
      { title: 'Exposure', body: 'Synthetic building locations and values meet the hazard layer.' },
      { title: 'Financial engine', body: 'Scenario losses form an illustrative EP curve.' },
    ],
  },
  workspace: {
    label: '03 — The workspace',
    heading: ['Trace the', 'result.'],
    body: 'The dashboard connects the map, portfolio, scenario losses, and model assumptions.',
    features: [
      { title: 'Explore', body: 'View building locations on an OpenStreetMap basemap.' },
      { title: 'Compare', body: 'See loss by housing class and scenario.' },
      { title: 'Read', body: 'Follow the EP curve from loss to assumed return period.' },
      { title: 'Explain', body: 'Review the risk briefing alongside model evidence.' },
      { title: 'Input', body: 'Preview free-text exposure before adding synthetic rows.' },
      { title: 'Check', body: 'Inspect the assumptions behind each run.' },
    ],
  },
  evidence: {
    label: '04 — The evidence',
    heading: ['Know the', 'inputs.'],
    body: 'The numbers describe this prototype and its source data. They are not a client portfolio or measured flood depths.',
    figures: [
      { value: '600', label: 'synthetic Nairobi buildings' },
      { value: '24', label: 'geocoded named flood hotspots used for validation' },
      { value: '0–1', label: 'relative susceptibility score, not flood depth' },
    ],
    limit: 'The terrain and river proxy can miss drainage-driven flooding in places such as Kibera and Westlands.',
  },
  closing: {
    label: '05 — Explore further',
    heading: ['Use the', 'atlas.'],
    body: 'Explore the model, then read its assumptions and limits alongside every result.',
  },
}
