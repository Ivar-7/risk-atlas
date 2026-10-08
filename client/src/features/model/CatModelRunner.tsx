import { useState } from 'react'
import { createRun, previewCoordinates, previewExposure } from './api'
import type { CoordinatePreview, ExposurePreview, RunResult } from './types'
import { clsLabel, money } from './format'

const exampleOffer = 'Synthetic residential offer for a Nairobi flood CAT demonstration. The schedule contains 25 informal iron-sheet houses in Kibera. Each building has an insured value of KES 800,000.'

export default function CatModelRunner({ onRun }: { onRun: (run: RunResult) => void }) {
  const [freeText, setFreeText] = useState('')
  const [applyDrainage, setApplyDrainage] = useState(false)
  const [deductiblePct, setDeductiblePct] = useState('0')
  const [policyLimitPct, setPolicyLimitPct] = useState('100')
  const [quotaSharePct, setQuotaSharePct] = useState('0')
  const [catXolApplies, setCatXolApplies] = useState(false)
  const [catAttachmentKes, setCatAttachmentKes] = useState('')
  const [catLimitKes, setCatLimitKes] = useState('')
  const [preview, setPreview] = useState<ExposurePreview | null>(null)
  const [coordinateFile, setCoordinateFile] = useState<File | null>(null)
  const [coordinatePreview, setCoordinatePreview] = useState<CoordinatePreview | null>(null)
  const [coordinatesApproved, setCoordinatesApproved] = useState(false)
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState<'preview' | 'run' | null>(null)
  const [error, setError] = useState('')

  function changeText(value: string) {
    setFreeText(value)
    setPreview(null)
    setApproved(false)
    setCoordinateFile(null)
    setCoordinatePreview(null)
    setCoordinatesApproved(false)
    setError('')
  }

  async function review() {
    setBusy('preview')
    setError('')
    setPreview(null)
    setApproved(false)
    setCoordinatePreview(null)
    setCoordinatesApproved(false)
    try {
      setPreview(await previewExposure(freeText))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not preview exposure')
    } finally {
      setBusy(null)
    }
  }

  async function reviewCoordinates() {
    if (!coordinateFile || !preview) return
    setBusy('preview')
    setError('')
    setCoordinatePreview(null)
    setCoordinatesApproved(false)
    try {
      setCoordinatePreview(await previewCoordinates(coordinateFile, preview.preview_id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not preview coordinate schedule')
    } finally {
      setBusy(null)
    }
  }

  async function runModel() {
    setBusy('run')
    setError('')
    try {
      const result = await createRun({
        apply_drainage_correction: applyDrainage,
        deductible_pct: Number(deductiblePct),
        policy_limit_pct: Number(policyLimitPct),
        quota_share_ceded_pct: Number(quotaSharePct),
        cat_xol_applies: catXolApplies,
        cat_xol_attachment_kes: catXolApplies ? Number(catAttachmentKes) : null,
        cat_xol_limit_kes: catXolApplies ? Number(catLimitKes) : null,
        free_text: freeText.trim() ? freeText : '',
        preview_id: freeText.trim() ? preview?.preview_id : undefined,
        exposure_reviewed: Boolean(freeText.trim() && approved),
        coordinate_preview_id: coordinatePreview?.coordinate_preview_id,
        coordinates_reviewed: Boolean(coordinatePreview && coordinatesApproved),
      })
      onRun(result)
      setPreview(null)
      setApproved(false)
      setCoordinateFile(null)
      setCoordinatePreview(null)
      setCoordinatesApproved(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not run the model')
    } finally {
      setBusy(null)
    }
  }

  const hasText = freeText.trim().length > 0
  const reviewable = Boolean(preview && preview.groups.length > 0 && !preview.notes.some((note) => note.startsWith('Skipped')))
  const validTerms = [deductiblePct, policyLimitPct, quotaSharePct].every((value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100)
    && (!catXolApplies || [catAttachmentKes, catLimitKes].every((value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0))

  return <section className="rounded-xl border border-border bg-surface p-5 text-text shadow-dashboard sm:p-6" aria-label="Flood CAT model controls">
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Nairobi flood CAT model</p>
      <h2 className="mt-1 text-xl font-semibold">Run a portfolio scenario</h2>
      <p className="mt-2 text-sm leading-6 text-text-muted">Start with the synthetic 600-building portfolio. Add synthetic exposure in plain English, review the extracted groups, then run the five assumed return periods.</p>
    </div>

    <label htmlFor="portfolio-text" className="mt-5 block text-sm font-medium">Additional synthetic exposure</label>
    <textarea
      id="portfolio-text"
      value={freeText}
      onChange={(event) => changeText(event.target.value)}
      disabled={busy !== null}
      maxLength={4000}
      rows={4}
      placeholder="25 informal iron-sheet houses in Kibera, KES 800000 each"
      className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm text-text outline-none placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
    />
    <p className="mt-1 text-xs text-text-muted">Count, construction class, named neighbourhood and insured value per building are required. New locations are synthetic points near the named centre.</p>
    <button type="button" onClick={() => changeText(exampleOffer)} disabled={busy !== null} className="mt-2 text-xs font-semibold text-accent underline disabled:opacity-50">Load synthetic residential offer example</button>

    <fieldset className="mt-5 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Assumed property policy terms</legend>
      <p className="mb-4 text-xs leading-5 text-text-muted">Applied separately to each building as a percentage of its TIV. The starter portfolio has no verified policy terms. A 0% deductible and 100% limit leave insured and ground-up loss equal.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">Deductible · % of building TIV<input type="number" min="0" max="100" step="0.1" value={deductiblePct} onChange={(event) => setDeductiblePct(event.target.value)} disabled={busy !== null} className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent" /></label>
        <label className="text-xs font-medium">Policy limit · % of building TIV<input type="number" min="0" max="100" step="0.1" value={policyLimitPct} onChange={(event) => setPolicyLimitPct(event.target.value)} disabled={busy !== null} className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent" /></label>
      </div>
    </fieldset>

    <fieldset className="mt-5 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Assumed portfolio reinsurance</legend>
      <p className="mb-4 text-xs leading-5 text-text-muted">After property deductibles and limits, quota share cedes a percentage of total gross loss. An optional catastrophe layer then recovers from the retained portfolio event loss, once per scenario.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">Quota share ceded · % of gross<input type="number" min="0" max="100" step="0.1" value={quotaSharePct} onChange={(event) => setQuotaSharePct(event.target.value)} disabled={busy !== null} className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent" /></label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={catXolApplies} onChange={(event) => setCatXolApplies(event.target.checked)} disabled={busy !== null} className="accent-accent" />Apply catastrophe excess of loss to retained event loss</label>
      {catXolApplies && <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">Cat XOL attachment · KES<input type="number" min="0" step="1" value={catAttachmentKes} onChange={(event) => setCatAttachmentKes(event.target.value)} disabled={busy !== null} className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent" /></label>
        <label className="text-xs font-medium">Cat XOL layer limit · KES<input type="number" min="0" step="1" value={catLimitKes} onChange={(event) => setCatLimitKes(event.target.value)} disabled={busy !== null} className="mt-2 w-full rounded-lg border border-input-border bg-surface p-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent" /></label>
      </div>}
    </fieldset>

    {hasText && <button type="button" onClick={() => void review()} disabled={busy !== null} className="mt-4 rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-danger-tint disabled:opacity-50">
      {busy === 'preview' ? 'Extracting…' : preview ? 'Preview again' : 'Preview exposure'}
    </button>}

    {preview && <div className="mt-5 rounded-lg border border-border bg-surface-alt p-4" aria-label="Exposure preview">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="text-sm font-semibold">Review extracted exposure</h3><p className="mt-1 text-xs text-text-muted">{preview.source === 'openai' ? `AI extraction${preview.model ? ` · ${preview.model}` : ''}` : 'Rules extraction · no AI used'} · {preview.rows_added} buildings · {money(preview.total_tiv_kes)} added TIV</p></div>
      </div>
      {preview.groups.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-120 text-left text-xs"><thead><tr className="border-b border-border text-text-muted"><th className="py-2">Construction</th><th>Place</th><th className="text-right">Count</th><th className="text-right">Value each</th><th className="text-right">Total</th></tr></thead><tbody>{preview.groups.map((group, index) => <tr key={`${group.place}-${index}`} className="border-b border-border/60"><td className="py-2">{clsLabel(group.housing_class)}</td><td>{group.place}</td><td className="text-right">{group.count}</td><td className="text-right">{money(group.tiv_each_kes)}</td><td className="text-right">{money(group.total_tiv_kes)}</td></tr>)}</tbody></table></div>}
      {preview.notes.map((note, index) => <p key={`${index}-${note}`} className="mt-2 text-xs text-text-muted">{note}</p>)}
      {reviewable && <label className="mt-4 flex items-start gap-2 text-xs"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} disabled={busy !== null} className="mt-0.5 accent-accent" /><span>I checked the count, construction, place and insured value. Add these synthetic buildings to the run.</span></label>}
      {!reviewable && <p className="mt-3 text-xs text-danger">Complete the exposure description and preview it again before running.</p>}
      {reviewable && <div className="mt-5 border-t border-border pt-4"><p className="text-xs font-semibold">Optional building coordinate schedule</p><p className="mt-1 text-xs leading-5 text-text-muted">Upload one CSV row per extracted building with loc_id, place, housing_class, tiv_kes, lat, lon and coordinate_source. The rows must match the reviewed groups. The API checks raster coverage and values; it cannot independently verify an address. <a href="/coordinate_schedule_template.csv" download className="font-semibold text-accent underline">Download the CSV template</a>.</p><input type="file" accept=".csv,text/csv" aria-label="Building coordinate schedule CSV" onChange={(event) => { setCoordinateFile(event.target.files?.[0] ?? null); setCoordinatePreview(null); setCoordinatesApproved(false) }} disabled={busy !== null} className="mt-3 block w-full text-xs text-text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text" />{coordinateFile && <button type="button" onClick={() => void reviewCoordinates()} disabled={busy !== null} className="mt-3 rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-danger-tint disabled:opacity-50">{busy === 'preview' ? 'Checking…' : 'Check coordinate schedule'}</button>}{coordinatePreview && <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-xs"><p className="font-semibold">{coordinatePreview.rows_count} coordinates matched · {coordinatePreview.filename}</p><p className="mt-1 text-text-muted">{coordinatePreview.status}</p><div className="mt-2 max-h-28 overflow-y-auto text-text-muted">{coordinatePreview.rows.slice(0, 5).map((row) => <p key={row.loc_id}>{row.loc_id} · {row.lat.toFixed(5)}, {row.lon.toFixed(5)} · {row.coordinate_source}</p>)}{coordinatePreview.rows_count > 5 && <p>…and {coordinatePreview.rows_count - 5} more rows</p>}</div><label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={coordinatesApproved} onChange={(event) => setCoordinatesApproved(event.target.checked)} disabled={busy !== null} className="mt-0.5 accent-accent" /><span>I checked these coordinates against the source schedule and want the model to use these points.</span></label></div>}</div>}
    </div>}

    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={applyDrainage} onChange={(event) => setApplyDrainage(event.target.checked)} disabled={busy !== null} className="accent-accent" />Include unvalidated drainage sensitivity in this run</label>
      <button type="button" onClick={() => void runModel()} disabled={busy !== null || !validTerms || (hasText && (!reviewable || !approved || Boolean(coordinateFile && (!coordinatePreview || !coordinatesApproved))))} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">{busy === 'run' ? 'Running model…' : 'Run flood model'}</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
  </section>
}
