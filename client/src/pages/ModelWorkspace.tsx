import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MapPin } from 'lucide-react'
import DocumentReview from '../features/model/DocumentReview'
import { calculateDocumentLoss, type DocumentAssessment, type LossCalculation, type LossTerms } from '../features/model/api'
import { money } from '../features/model/format'

const emptyTerms: LossTerms = {
  ground_up_loss_kes: '', deductible_kes: '', policy_limit_kes: '', quota_share_ceded_pct: '',
  cat_xol_applies: false, cat_xol_attachment_kes: null, cat_xol_limit_kes: null,
}
const currency = (value: number | string) => money(Number(value))
const plainAmount = (value?: string) => value?.match(/^(?:KES\s*)?([\d,]+(?:\.\d{1,2})?)$/i)?.[1].replaceAll(',', '') ?? ''
const percent = (value?: string) => value?.match(/^(\d+(?:\.\d{1,2})?)\s*%$/)?.[1] ?? ''
function initialTerms(assessment: DocumentAssessment): LossTerms {
  const f = assessment.fields
  const layer = f.catastrophe_excess_of_loss?.value.match(/^KES\s*([\d,]+(?:\.\d{1,2})?)\s*(?:xs|excess of)\s*KES\s*([\d,]+(?:\.\d{1,2})?)$/i)
  return {
    ground_up_loss_kes: plainAmount(f.ground_up_loss?.value),
    deductible_kes: plainAmount(f.flood_deductible?.value),
    policy_limit_kes: plainAmount(f.limit?.value),
    quota_share_ceded_pct: percent(f.quota_share?.value),
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
    L.marker(point).bindPopup(`${name}<br>${evidence.latitude}, ${evidence.longitude}`).addTo(map)
    return () => { map.remove() }
  }, [evidence.latitude, evidence.longitude, name])
  return <div ref={node} className="h-[330px] w-full rounded-xl bg-[#0e181b]" aria-label={`Map pin at ${evidence.latitude}, ${evidence.longitude}`} />
}

function NumericInput({ label, value, onChange, hint, source }: { label: string; value: string; onChange: (value: string) => void; hint?: string; source?: string }) {
  return <label className="block text-xs text-white/65"><span className="font-medium text-white/85">{label}</span>
    <input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter verified amount" className="mt-2 w-full rounded-lg border border-white/15 bg-[#0c1013] p-3 text-sm text-white outline-none focus:border-emerald-200/60" />
    {source && <span className="mt-1 block text-[11px] text-emerald-200/65">Extracted · {source}</span>}
    {hint && <span className="mt-1 block text-[11px] text-white/40">{hint}</span>}
  </label>
}

export default function ModelWorkspace({ assessment, onReviewed }: { assessment: DocumentAssessment | null; onReviewed: (assessment: DocumentAssessment) => void }) {
  const [terms, setTerms] = useState<LossTerms>(emptyTerms)
  const [result, setResult] = useState<LossCalculation | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setTerms(assessment ? initialTerms(assessment) : emptyTerms); setResult(null); setConfirmed(false); setError('') }, [assessment])
  const update = (patch: Partial<LossTerms>) => { setTerms((current) => ({ ...current, ...patch })); setResult(null); setConfirmed(false) }
  async function calculate() {
    setBusy(true); setError('')
    try { setResult(await calculateDocumentLoss(terms)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not calculate loss') }
    finally { setBusy(false) }
  }
  const fields = assessment?.fields
  const evidence = assessment?.model_evidence
  const complete = terms.ground_up_loss_kes !== '' && terms.deductible_kes !== '' && terms.policy_limit_kes !== '' && terms.quota_share_ceded_pct !== '' && (!terms.cat_xol_applies || (terms.cat_xol_attachment_kes !== null && terms.cat_xol_limit_kes !== null && terms.cat_xol_attachment_kes !== '' && terms.cat_xol_limit_kes !== ''))
  const graph = result ? [
    { name: 'Ground-up', loss: Number(result.ground_up_loss_kes) },
    { name: 'Gross', loss: Number(result.gross_loss_kes) },
    { name: 'After quota share', loss: Number(result.retained_before_cat_kes) },
    { name: 'Net', loss: Number(result.net_loss_kes) },
  ] : []
  const summary = result ? [
    ['Ground-up loss', currency(result.ground_up_loss_kes)],
    ['Deductible', currency(result.deductible_kes)],
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

  return <div className="space-y-5 rounded-xl bg-[#0c1013] p-4 text-white sm:p-6">
    <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200/70">Model workspace</p><h2 className="mt-1 text-xl font-semibold">Document and loss model</h2></div>
    <DocumentReview onReviewed={onReviewed} />
    {!assessment ? <p className="rounded-xl border border-white/10 bg-[#141b1d] p-5 text-sm text-white/55">Upload a property document to locate the risk and review its terms. A verified ground-up loss and contract terms are required for the loss calculation.</p> : <>
      <div className="rounded-xl border border-white/10 bg-[#141b1d] p-5"><p className="font-semibold">{fields?.insured?.value || assessment.filename}</p><p className="mt-1 text-xs text-white/50">{assessment.filename} · {Object.keys(fields ?? {}).length} source fields extracted. Check each value against the document.</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/65">{fields?.address && <span>{fields.address.value} · {fields.address.source}</span>}{fields?.total_insured_value && <span>Stated TIV: KES {fields.total_insured_value.value} · {fields.total_insured_value.source}</span>}</div></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#141b1d] p-5"><h3 className="font-semibold">Verified financial inputs</h3><p className="mt-1 text-xs leading-5 text-white/50">The model calculates a single occurrence from these amounts. It does not infer damage from the hazard proxy or insured value.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumericInput label="Ground-up loss · KES" value={terms.ground_up_loss_kes} onChange={(value) => update({ ground_up_loss_kes: value })} source={fields?.ground_up_loss?.source} hint="Use a documented event loss or verified claims amount." />
            <NumericInput label="Deductible · KES" value={terms.deductible_kes} onChange={(value) => update({ deductible_kes: value })} source={plainAmount(fields?.flood_deductible?.value) ? fields?.flood_deductible?.source : undefined} hint={fields?.flood_deductible && !plainAmount(fields.flood_deductible.value) ? `Document says: ${fields.flood_deductible.value}. Enter the applicable amount.` : undefined} />
            <NumericInput label="Policy limit · KES" value={terms.policy_limit_kes} onChange={(value) => update({ policy_limit_kes: value })} source={fields?.limit?.source} />
            <NumericInput label="Quota share ceded · %" value={terms.quota_share_ceded_pct} onChange={(value) => update({ quota_share_ceded_pct: value })} source={fields?.quota_share?.source} />
          </div>
          <label className="mt-5 flex items-start gap-2 text-xs text-white/70"><input type="checkbox" checked={terms.cat_xol_applies} onChange={(event) => update({ cat_xol_applies: event.target.checked })} className="accent-emerald-200" /><span>Catastrophe excess of loss applies to this occurrence</span></label>
          {terms.cat_xol_applies && <div className="mt-4 grid gap-4 sm:grid-cols-2"><NumericInput label="Cat XOL attachment · KES" value={terms.cat_xol_attachment_kes ?? ''} onChange={(value) => update({ cat_xol_attachment_kes: value })} source={fields?.catastrophe_excess_of_loss?.source} /><NumericInput label="Cat XOL layer limit · KES" value={terms.cat_xol_limit_kes ?? ''} onChange={(value) => update({ cat_xol_limit_kes: value })} source={fields?.catastrophe_excess_of_loss?.source} /></div>}
          <label className="mt-5 flex items-start gap-2 text-xs text-white/70"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="accent-emerald-200" /><span>I verified the loss amount, deductible, policy limit, quota share, applicable layer and calculation order against the source contracts.</span></label>
          <button type="button" disabled={!complete || !confirmed || busy} onClick={() => void calculate()} className="mt-5 rounded-lg bg-emerald-200 px-5 py-2.5 text-sm font-semibold text-[#0b1713] disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Calculating…' : 'Calculate loss'}</button>
          {error && <p role="alert" className="mt-3 text-xs text-rose-200">{error}</p>}
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#141b1d] p-5"><div className="mb-4 flex items-center gap-2"><MapPin size={16} className="text-emerald-200" /><h3 className="font-semibold">Document coordinates</h3></div>
          {evidence ? <><PropertyMap evidence={evidence} name={fields?.address?.value || assessment.filename} /><p className="mt-3 text-xs text-white/60">Pin: {evidence.latitude}, {evidence.longitude} · {fields?.coordinates?.source || 'Document'}</p><p className="mt-1 text-xs text-white/40">{evidence.proxy_covered ? 'Hazard proxy covers this point.' : 'Outside the current hazard layer; the document point is still mapped.'} Coordinate extraction locates the point; it does not verify the street address.</p></> : <p className="text-sm text-white/50">No valid coordinates were extracted. Confirm them in the document before using the map.</p>}
        </section>
      </div>
      {result && <>{conflicts.length > 0 && <div role="alert" className="rounded-xl border border-amber-200/25 bg-amber-200/5 p-4 text-xs text-amber-100"><p className="font-semibold">Calculated and document losses differ. Check terms before relying on these figures.</p>{conflicts.map((item) => <p key={item} className="mt-1">{item}</p>)}</div>}<section aria-label="Calculated loss and treaty summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summary.map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-[#141b1d] p-4"><p className="text-xs text-white/50">{label}</p><p className="mt-3 break-words text-lg font-semibold">{value}</p></div>)}</section>
        <section className="rounded-2xl border border-white/10 bg-[#141b1d] p-5"><h3 className="font-semibold">Loss waterfall</h3><p className="mt-1 text-xs text-white/50">{result.basis}</p><div className="mt-5 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={graph}><CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis dataKey="name" tick={{ fill: '#a0aaa7', fontSize: 11 }} /><YAxis tickFormatter={(v) => money(Number(v))} width={85} tick={{ fill: '#a0aaa7', fontSize: 11 }} /><Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: '#172126', border: '1px solid rgba(255,255,255,.15)' }} /><Bar dataKey="loss" name="KES" fill="#a7f3d0" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      </>}
    </>}
  </div>
}
