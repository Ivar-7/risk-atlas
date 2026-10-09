import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileText, MapPin } from 'lucide-react'
import LiquidWaveSpinner from '@/components/ui/spinner-10'
import DocumentReview from '../features/model/DocumentReview'
import { calculateDocumentLoss, type DocumentAssessment, type LossCalculation, type LossTerms, type PropertyCalculation } from '../features/model/api'
import { money } from '../features/model/format'
import { chartTheme } from '../lib/chartTheme'

const emptyTerms: LossTerms = {
  ground_up_loss_kes: '', deductible_kes: '', policy_limit_kes: '', quota_share_ceded_pct: '',
  cat_xol_applies: false, cat_xol_attachment_kes: null, cat_xol_limit_kes: null,
}
const currency = (value: number | string) => money(Number(value))
const plainAmount = (value?: string) => value?.match(/^(?:KES\s*)?([\d,]+(?:\.\d{1,2})?)$/i)?.[1].replaceAll(',', '') ?? ''
const percent = (value?: string) => value?.match(/^(\d+(?:\.\d{1,2})?)\s*%$/)?.[1] ?? ''
function deductibleFromDocument(value: string | undefined, groundUpLoss: number | undefined): string {
  const direct = plainAmount(value)
  if (direct) return direct
  const withMinimum = value?.match(/(\d+(?:\.\d+)?)\s*%.*?KES\s*([\d,]+(?:\.\d{1,2})?)\s*minimum/i)
  if (withMinimum && groundUpLoss !== undefined) return (Math.round(Math.max(groundUpLoss * Number(withMinimum[1]) / 100, Number(withMinimum[2].replaceAll(',', ''))) * 100) / 100).toFixed(2)
  const rate = value?.match(/(\d+(?:\.\d+)?)\s*%/)
  return rate && groundUpLoss !== undefined ? (Math.round(groundUpLoss * Number(rate[1])) / 100).toFixed(2) : ''
}
function initialTerms(assessment: DocumentAssessment, tier = 'severe'): LossTerms {
  const f = assessment.fields
  const model = assessment.financial_model
  const modelledLoss = model?.scenarios.find((scenario) => scenario.tier === tier)?.ground_up_loss_kes
  const groundUpLoss = modelledLoss ?? Number(plainAmount(f.ground_up_loss?.value) || NaN)
  const layer = f.catastrophe_excess_of_loss?.value.match(/^KES\s*([\d,]+(?:\.\d{1,2})?)\s*(?:xs|excess of)\s*KES\s*([\d,]+(?:\.\d{1,2})?)$/i)
  return {
    ground_up_loss_kes: model ? String(modelledLoss ?? '') : plainAmount(f.ground_up_loss?.value),
    deductible_kes: deductibleFromDocument(f.flood_deductible?.value, Number.isFinite(groundUpLoss) ? groundUpLoss : undefined) || (model ? '0' : ''),
    policy_limit_kes: plainAmount(f.limit?.value) || (model ? String(model.tiv_kes) : ''),
    quota_share_ceded_pct: percent(f.quota_share?.value) || (model ? '0' : ''),
    cat_xol_applies: Boolean(layer),
    cat_xol_attachment_kes: layer?.[2].replaceAll(',', '') ?? null,
    cat_xol_limit_kes: layer?.[1].replaceAll(',', '') ?? null,
  }
}

function PropertyMap({ evidence, name }: { evidence: NonNullable<DocumentAssessment['model_evidence']>; name: string }) {
  const node = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!node.current) return
    const point: L.LatLngTuple = [evidence.latitude, evidence.longitude]
    const map = L.map(node.current).setView(point, 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map)
    const icon = L.divIcon({
      className: '',
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2a13 13 0 0 0-13 13c0 9.5 13 22 13 22s13-12.5 13-22A13 13 0 0 0 16 2Z" fill="var(--color-accent)" stroke="white" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="white"/></svg>',
      iconSize: [32, 40],
      iconAnchor: [16, 37],
      popupAnchor: [0, -34],
    })
    const popup = document.createElement('div')
    const title = document.createElement('strong')
    title.textContent = name
    const coordinates = document.createElement('div')
    coordinates.textContent = `${evidence.latitude}, ${evidence.longitude}`
    popup.append(title, coordinates)
    L.marker(point, { icon }).bindPopup(popup).addTo(map)
    return () => { map.remove() }
  }, [evidence.latitude, evidence.longitude, name])
  return <div ref={node} className="h-82.5 w-full rounded-xl bg-surface-alt" aria-label={`Map pin at ${evidence.latitude}, ${evidence.longitude}`} />
}

function NumericInput({ label, value, onChange, hint, source, readOnly = false }: { label: string; value: string; onChange: (value: string) => void; hint?: string; source?: string; readOnly?: boolean }) {
  return <label className="block text-xs text-text-muted"><span className="font-medium text-text">{label}</span>
    <input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} placeholder="Enter verified amount" className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm text-text outline-none placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface read-only:bg-surface-alt" />
    {source && <span className="mt-1 block text-[11px] text-success">{source}</span>}
    {hint && <span className="mt-1 block text-[11px] text-text-muted">{hint}</span>}
  </label>
}

export default function ModelWorkspace({ assessment, calculation, onReviewed, onCalculated, onInvalidated }: { assessment: DocumentAssessment | null; calculation: PropertyCalculation | null; onReviewed: (assessment: DocumentAssessment) => void; onCalculated: (calculation: PropertyCalculation) => void; onInvalidated: () => void }) {
  const [terms, setTerms] = useState<LossTerms>(() => calculation?.terms ?? (assessment ? initialTerms(assessment) : emptyTerms))
  const [result, setResult] = useState<LossCalculation | null>(() => calculation?.result ?? null)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [selectedTier, setSelectedTier] = useState(calculation?.tier ?? 'severe')
  const reviewDocument = (next: DocumentAssessment) => { setSelectedTier('severe'); setTerms(initialTerms(next)); setResult(null); setConfirmed(false); setError(''); onInvalidated(); onReviewed(next) }
  const update = (patch: Partial<LossTerms>) => { setTerms((current) => ({ ...current, ...patch })); setResult(null); setConfirmed(false); onInvalidated() }
  async function calculate() {
    setBusy(true); setError('')
    try {
      const calculated = await calculateDocumentLoss(terms)
      setResult(calculated)
      if (assessment) onCalculated({ assessment, terms: { ...terms }, tier: selectedTier, result: calculated })
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not calculate loss') }
    finally { setBusy(false) }
  }
  const fields = assessment?.fields
  const evidence = assessment?.model_evidence
  const financialModel = assessment?.financial_model
  const selectedScenario = financialModel?.scenarios.find((scenario) => scenario.tier === selectedTier)
  const floodExcluded = fields?.coverage?.value.toLowerCase().includes('excluding flood')
  const chooseTier = (tier: string) => {
    setSelectedTier(tier)
    const loss = financialModel?.scenarios.find((scenario) => scenario.tier === tier)?.ground_up_loss_kes
    setTerms((current) => ({ ...current, ground_up_loss_kes: String(loss ?? ''), deductible_kes: deductibleFromDocument(fields?.flood_deductible?.value, loss) || current.deductible_kes }))
    setResult(null)
    setConfirmed(false)
    onInvalidated()
  }
  const complete = terms.ground_up_loss_kes !== '' && terms.deductible_kes !== '' && terms.policy_limit_kes !== '' && terms.quota_share_ceded_pct !== '' && (!terms.cat_xol_applies || (terms.cat_xol_attachment_kes !== null && terms.cat_xol_limit_kes !== null && terms.cat_xol_attachment_kes !== '' && terms.cat_xol_limit_kes !== ''))
  const graph = result ? [
    { name: 'Ground-up', loss: Number(result.ground_up_loss_kes) },
    { name: 'Gross', loss: Number(result.gross_loss_kes) },
    { name: 'After quota share', loss: Number(result.retained_before_cat_kes) },
    { name: 'Net', loss: Number(result.net_loss_kes) },
  ] : []
  const summary = result ? [
    ['Ground-up loss', currency(result.ground_up_loss_kes)],
    ['Deductible applied', `${currency(result.deductible_applied_kes)} · ${currency(result.deductible_kes)} threshold`],
    ['Limit', currency(result.policy_limit_kes)],
    ['Gross loss', currency(result.gross_loss_kes)],
    ['Quota share', `${result.quota_share_ceded_pct}% ceded · ${currency(result.quota_share_recovery_kes)}`],
    ['Catastrophe excess of loss', result.cat_xol_applies ? `${currency(result.cat_xol_limit_kes!)} xs ${currency(result.cat_xol_attachment_kes!)} · recovery ${currency(result.cat_xol_recovery_kes)}` : 'Not applicable'],
    ['Net loss', currency(result.net_loss_kes)],
  ] : []
  const conflicts = result && fields ? [
    { label: 'Gross loss', field: fields.gross_loss, calculated: result.gross_loss_kes },
    { label: 'Net loss', field: fields.net_loss, calculated: result.net_loss_kes },
  ].filter(({ field, calculated }) => field && Number(plainAmount(field.value)) !== Number(calculated))
    .map(({ label, field, calculated }) => `${label}: document KES ${field!.value}; calculated ${currency(calculated)}`) : []

  return <div className="space-y-5 p-4 text-text sm:p-6">
    <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Model workspace</p><h2 className="mt-1 text-xl font-semibold">Document and loss model</h2></div>
    <DocumentReview onReviewed={reviewDocument} onAnalyzing={setAnalyzing} />
    {analyzing ? <LiquidWaveSpinner size="lg" className="mx-auto py-4" /> : !assessment ? <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-muted">Upload a property document to locate the risk. When it states a construction type and insured value within the hazard layer, the model calculates illustrative losses across five scenarios.</p> : <>
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <p className="text-base font-semibold leading-6 text-text">{fields?.insured?.value || assessment.filename}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-text-muted"><FileText size={13} className="shrink-0 text-accent" /><span className="break-all">{assessment.filename}</span></span>
          <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-text-muted">{Object.keys(fields ?? {}).length} source fields extracted</span>
        </div>
        <p className="mt-1.5 text-[11px] text-text-muted">Check each value against the document.</p>
        {(fields?.address || fields?.total_insured_value) && <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.address && <div className="min-w-0 rounded-lg border border-accent/15 border-l-2 border-l-accent/70 bg-surface-alt/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Address</p>
            <p className="mt-1 text-sm font-medium leading-5 text-text">{fields.address.value}</p>
            <span className="mt-2 inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted">{fields.address.source}</span>
          </div>}
          {fields.total_insured_value && <div className="min-w-0 rounded-lg border border-accent/15 border-l-2 border-l-accent/70 bg-surface-alt/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Stated TIV</p>
            <p className="mt-1 text-lg font-semibold leading-6 text-accent"><span className="mr-1 text-xs font-medium text-text-muted">KES</span>{fields.total_insured_value.value}</p>
            <span className="mt-2 inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted">{fields.total_insured_value.source}</span>
          </div>}
        </div>}
      </div>
      {financialModel && <section className="rounded-xl border border-border bg-surface p-5 shadow-dashboard" aria-label="Modelled document scenario losses">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Modelled flood damage by scenario</h3><p className="mt-1 text-xs leading-5 text-text-muted">Hazard score at the document coordinates → damage ratio for {financialModel.housing_class.replaceAll('_', ' ')} → physical loss on {currency(financialModel.tiv_kes)} stated TIV. Return periods are assumed; scenario names follow common (10y) to extreme (250y), with supplied masks mapped in reverse footprint order.</p></div><label className="text-xs font-medium">Scenario for financial terms<select value={selectedTier} onChange={(event) => chooseTier(event.target.value)} className="mt-2 block rounded-md border border-input-border bg-surface px-3 py-2 text-sm">{financialModel.scenarios.map((scenario) => <option key={scenario.tier} value={scenario.tier}>1-in-{scenario.return_period_years} · {scenario.tier}</option>)}</select></label></div>
        <div className="mt-5 h-64 w-full" role="img" aria-label="Modelled ground-up flood loss by assumed return period for this document"><ResponsiveContainer width="100%" height="100%"><LineChart data={financialModel.scenarios} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke={chartTheme.grid} /><XAxis dataKey="return_period_years" tickFormatter={(value: number) => `${value}y`} tick={{ fill: chartTheme.axisLabel, fontSize: 12 }} /><YAxis tickFormatter={(value: number) => money(value).replace('KES ', '')} width={70} tick={{ fill: chartTheme.axisLabel, fontSize: 12 }} /><Tooltip formatter={(value) => money(Number(value))} labelFormatter={(value) => `1-in-${value} assumed return period`} contentStyle={chartTheme.tooltip.contentStyle} /><Line type="linear" dataKey="ground_up_loss_kes" name="Ground-up loss" stroke={chartTheme.primary} strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">{financialModel.scenarios.map((scenario) => <div key={scenario.tier} className={`rounded-lg border p-3 text-xs ${scenario.tier === selectedTier ? 'border-accent bg-danger-tint' : 'border-border'}`}><p className="font-semibold">1-in-{scenario.return_period_years}</p><p className="mt-1 text-text-muted">Source {scenario.source_tier} · score {scenario.hazard_score.toFixed(2)} · {(scenario.damage_ratio * 100).toFixed(1)}% damage</p><p className="mt-1 font-medium">{currency(scenario.ground_up_loss_kes)}</p></div>)}</div>
        {selectedScenario?.hazard_score === 0 && financialModel.scenarios.some((scenario) => scenario.hazard_score > 0) && <p className="mt-4 rounded-lg border border-warning/25 bg-warning-tint p-3 text-xs leading-5 text-warning">The selected 1-in-{selectedScenario.return_period_years} tier has no proxy signal at these coordinates, so its modelled physical loss is zero. A rarer tier has a positive signal; select that tier above to review its financial terms and recalculate. Zero proxy signal does not establish flood safety.</p>}
        {financialModel.scenarios.every((scenario) => scenario.hazard_score === 0) && <p className="mt-4 rounded-lg border border-warning/25 bg-warning-tint p-3 text-xs text-warning">This point has zero signal in all five proxy rasters, so this model calculates zero damage here. The proxy misses drainage-driven flooding; zero is not evidence that the property is safe.</p>}
        <p className="mt-4 text-xs leading-5 text-text-muted">{financialModel.basis} {financialModel.construction_warning}</p>
      </section>}
      {!financialModel && <p className="rounded-xl border border-warning/25 bg-warning-tint p-4 text-xs text-warning">A modelled loss needs a stated TIV, a recognizable construction type, and coordinates inside the hazard layer. A source-backed ground-up loss can still be entered below.</p>}
      {floodExcluded && <p role="alert" className="rounded-xl border border-warning/25 bg-warning-tint p-4 text-xs text-warning">The document appears to exclude flood cover. Physical damage shown here is not an insured claim; any gross or net calculation below is conditional on flood cover and the entered terms.</p>}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-dashboard"><h3 className="font-semibold">Scenario financial terms</h3><p className="mt-1 text-xs leading-5 text-text-muted">{financialModel ? `Ground-up loss is calculated for the 1-in-${selectedScenario?.return_period_years} scenario. Review document terms and any labelled assumptions before calculating gross and net loss.` : 'Enter a documented ground-up loss and verified or explicitly assumed terms to calculate one occurrence.'}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumericInput label="Ground-up loss · KES" value={terms.ground_up_loss_kes} onChange={(value) => update({ ground_up_loss_kes: value })} readOnly={Boolean(financialModel)} source={financialModel ? 'Calculated from proxy, vulnerability and TIV' : fields?.ground_up_loss?.source ? `Document · ${fields.ground_up_loss.source}` : undefined} hint={financialModel ? 'Physical damage before insurance terms.' : 'Use a documented event loss or verified claims amount.'} />
            <NumericInput label="Deductible threshold · KES" value={terms.deductible_kes} onChange={(value) => update({ deductible_kes: value })} source={fields?.flood_deductible && terms.deductible_kes ? `Derived from wording · ${fields.flood_deductible.source}` : undefined} hint={!fields?.flood_deductible && financialModel ? 'Assumed zero deductible. Change if verified terms differ.' : fields?.flood_deductible?.value.includes('%') ? `${fields.flood_deductible.value}. Percentage is assumed to apply to modelled loss; confirm the contract basis.` : fields?.flood_deductible?.value || 'Enter a documented or explicitly assumed deductible.'} />
            <NumericInput label="Policy limit · KES" value={terms.policy_limit_kes} onChange={(value) => update({ policy_limit_kes: value })} source={fields?.limit?.source ? `Document · ${fields.limit.source}` : undefined} hint={!fields?.limit && financialModel ? 'Assumed cap: 100% of stated TIV. Change if verified terms differ.' : undefined} />
            <NumericInput label="Quota share ceded · %" value={terms.quota_share_ceded_pct} onChange={(value) => update({ quota_share_ceded_pct: value })} source={fields?.quota_share?.source ? `Document · ${fields.quota_share.source}` : undefined} hint={!fields?.quota_share && financialModel ? 'Assumed 0% cession. Optional treaty sensitivity.' : undefined} />
          </div>
          <label className="mt-5 flex items-start gap-2 text-xs text-text-muted"><input type="checkbox" checked={terms.cat_xol_applies} onChange={(event) => update({ cat_xol_applies: event.target.checked })} className="accent-accent" /><span>Catastrophe excess of loss applies to this occurrence</span></label>
          {terms.cat_xol_applies && <div className="mt-4 grid gap-4 sm:grid-cols-2"><NumericInput label="Cat XOL attachment · KES" value={terms.cat_xol_attachment_kes ?? ''} onChange={(value) => update({ cat_xol_attachment_kes: value })} source={fields?.catastrophe_excess_of_loss?.source} /><NumericInput label="Cat XOL layer limit · KES" value={terms.cat_xol_limit_kes ?? ''} onChange={(value) => update({ cat_xol_limit_kes: value })} source={fields?.catastrophe_excess_of_loss?.source} /></div>}
          <label className="mt-5 flex items-start gap-2 text-xs text-text-muted"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="accent-accent" /><span>I reviewed the extracted values and understand that proxy damage, return periods and any terms labelled “assumed” are illustrative.</span></label>
          <button type="button" disabled={!complete || !confirmed || busy} onClick={() => void calculate()} className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Calculating…' : 'Calculate loss'}</button>
          {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}
        </section>
        <section className="rounded-xl border border-border bg-surface p-5 shadow-dashboard"><div className="mb-4 flex items-center gap-2"><MapPin size={16} className="text-accent" /><h3 className="font-semibold">Document coordinates</h3></div>
          {evidence ? <><PropertyMap evidence={evidence} name={fields?.address?.value || assessment.filename} /><p className="mt-3 text-xs text-text-muted">Pin: {evidence.latitude}, {evidence.longitude} · {fields?.coordinates?.source || 'Document'}</p><p className="mt-1 text-xs text-text-muted">{evidence.proxy_covered ? 'Hazard proxy covers this point.' : 'Outside the current hazard layer; the document point is still mapped.'} Coordinate extraction locates the point; it does not verify the street address.</p></> : <p className="text-sm text-text-muted">No valid coordinates were extracted. Confirm them in the document before using the map.</p>}
        </section>
      </div>
      {result && <>{conflicts.length > 0 && <div role="alert" className="rounded-xl border border-warning/25 bg-warning-tint p-4 text-xs text-warning"><p className="font-semibold">Calculated and document losses differ. Check terms before relying on these figures.</p>{conflicts.map((item) => <p key={item} className="mt-1">{item}</p>)}</div>}<section aria-label="Calculated loss and treaty summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summary.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-surface p-4 shadow-dashboard"><p className="text-xs text-text-muted">{label}</p><p className="mt-3 wrap-break-word text-lg font-semibold">{value}</p></div>)}</section>
        <section className="rounded-xl border border-border bg-surface p-5 shadow-dashboard"><h3 className="font-semibold">Loss waterfall</h3><p className="mt-1 text-xs text-text-muted">{result.basis}</p><div className="mt-5 h-75"><ResponsiveContainer width="100%" height="100%"><BarChart data={graph}><CartesianGrid stroke={chartTheme.grid} strokeWidth={1} /><XAxis dataKey="name" axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} /><YAxis tickFormatter={(v) => money(Number(v))} width={85} axisLine={{ stroke: chartTheme.axis }} tick={{ fill: chartTheme.axisLabel, fontSize: chartTheme.fontSize }} /><Tooltip formatter={(v) => money(Number(v))} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} /><Bar dataKey="loss" name="KES" fill={chartTheme.primary} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      </>}
    </>}
  </div>
}
