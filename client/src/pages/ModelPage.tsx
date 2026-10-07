import { useCallback, useEffect, useState } from 'react'
import { Activity, ArrowLeft, BrainCircuit, Download, Info, LayoutDashboard, Menu, Play, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { navigate } from '../App'
import { createRun, defaultControls, explainLocation, fetchAudit, fetchLatest, type Audit } from '../features/model/api'
import { ClassChart, EpChart, ShapGlobal } from '../features/model/Charts'
import { clsLabel, money, pct } from '../features/model/format'
import MapView from '../features/model/MapView'
import type { Controls, Explanation, RunResult } from '../features/model/types'

type Tab = 'Results' | 'AI layer' | 'Explain' | 'Assumptions'
const tabs: { label: Tab; icon: typeof Activity }[] = [
  { label: 'Results', icon: Activity }, { label: 'AI layer', icon: BrainCircuit },
  { label: 'Explain', icon: ShieldCheck }, { label: 'Assumptions', icon: Info },
]
const card = 'min-w-0 rounded-2xl border border-white/10 bg-[#141b1d] p-5 sm:p-6'
const muted = 'text-xs leading-5 text-white/45'

function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/65">{eyebrow}</p><h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>{description && <p className={`mt-1 ${muted}`}>{description}</p>}</div>
}

function exportLocations(run: RunResult) {
  const fields = ['loc_id', 'synthetic', 'source', 'lat', 'lon', 'housing_class', 'nearest_hotspot', 'tiv_kes', 'aal_kes', 'loss_cost_pct'] as const
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [fields.join(','), ...run.locations.map((row) => fields.map((field) => escape(row[field])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `risk-atlas-${run.run_id.slice(0, 8)}-locations.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ModelPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('Results')
  const [controls, setControls] = useState<Controls>(defaultControls)
  const [run, setRun] = useState<RunResult | null>(null)
  const [selected, setSelected] = useState<string>()
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [audit, setAudit] = useState<Audit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const latest = await fetchLatest()
      setRun(latest)
      setControls(latest.controls)
    } catch (reason) {
      setError(`${reason instanceof Error ? reason.message : 'Could not load model'}. Start the API on port 8000 and retry.`)
    } finally { setBusy(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!run || !selected) { return }
    let active = true
    setExplanation(null)
    void explainLocation(run.run_id, selected).then((value) => { if (active) setExplanation(value) }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not explain location')
    })
    return () => { active = false }
  }, [run, selected])
  useEffect(() => {
    if (tab !== 'Assumptions' || !run) return
    let active = true
    void fetchAudit().then((value) => { if (active) setAudit(value) }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load audit ledger')
    })
    return () => { active = false }
  }, [tab, run])

  async function runModel() {
    setBusy(true)
    setError('')
    try {
      const result = await createRun(controls)
      setRun(result)
      setSelected(undefined)
      setExplanation(null)
      setAudit(null)
      setTab('Results')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Model run failed') }
    finally { setBusy(false) }
  }

  function selectLocation(id: string) { setSelected(id); setTab('Explain') }

  return <div className="min-h-screen bg-[#0c1013] font-sans text-white lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-0 z-40 flex-col border-r border-white/10 bg-[#10171a] px-5 pb-6 pt-7 lg:sticky lg:top-0 lg:flex lg:h-screen`}>
      <div className="flex items-center justify-between"><img src="/assets/logo-horizontal-dark.svg" alt="Risk Atlas" className="h-9 w-auto" /><button type="button" className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <p className="mt-12 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Model workspace</p>
      <nav className="mt-3 space-y-1" aria-label="Model navigation">
        {tabs.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => { setTab(label); setMenuOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${tab === label ? 'bg-emerald-200/10 text-emerald-100' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}><Icon size={18} strokeWidth={1.7} />{label}</button>)}
      </nav>
      <div className="mt-auto rounded-xl border border-emerald-200/15 bg-emerald-200/5.5 p-4"><div className="flex items-center gap-2 text-sm text-emerald-100"><ShieldCheck size={17} /> Prototype workspace</div><p className="mt-2 text-xs leading-5 text-white/45">Synthetic exposure, proxy hazard, assumed return periods. Results are illustrative.</p></div>
      <button type="button" onClick={() => navigate('/dashboard')} className="mt-5 flex items-center gap-3 border-t border-white/10 px-2 pt-5 text-left text-sm text-white/50 hover:text-white"><LayoutDashboard size={16} /> Dashboard overview</button>
      <button type="button" onClick={() => navigate('/')} className="mt-3 flex items-center gap-3 px-2 text-left text-sm text-white/50 hover:text-white"><ArrowLeft size={16} /> Back to site</button>
    </aside>
    <div className="min-w-0">
      <header className="flex h-18 items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-8 xl:px-10"><div className="flex items-center gap-3"><button type="button" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button><span className="hidden text-sm text-white/40 sm:inline">Risk Atlas /</span><span className="text-sm font-medium">Nairobi model workspace</span></div><span className={`flex items-center gap-2 text-xs ${run ? 'text-emerald-200' : 'text-amber-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${run ? 'bg-emerald-300' : 'bg-amber-300'}`} />{run ? 'API connected' : 'API unavailable'}</span></header>
      <main className="mx-auto max-w-[1600px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200/70">Kenya Re hackathon · Team A</p><h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Run the Nairobi flood model</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Change the drainage correction or add synthetic exposure, then inspect the resulting losses and explanation.</p></div>{run && <button type="button" onClick={() => exportLocations(run)} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/5"><Download size={15} /> Export locations CSV</button>}</div>
        <div className="my-7 flex items-start gap-3 rounded-xl border border-amber-200/15 bg-amber-200/4.5 px-4 py-3 text-xs leading-5 text-amber-50/70"><Info size={16} className="mt-0.5 shrink-0 text-amber-200/75" /><p>{run ? `${run.metrics.synthetic_locations} of ${run.metrics.locations} exposure locations are declared synthetic. ` : ''}Hazard is a susceptibility proxy, not measured water depth. Return periods and score-to-depth conversion are assumptions. Do not use these results for underwriting.</p></div>
        <section className={`${card} mb-5`} aria-label="Model controls"><div className="flex flex-wrap items-start justify-between gap-4"><Heading eyebrow="Run controls" title="Configure the next run" description="These inputs affect the live model engine." />{run && <span className="text-[11px] text-white/40">Run {run.run_id.slice(0, 8)} · {new Date(run.created_at).toLocaleString('en-KE')}</span>}</div><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-end"><label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm"><input type="checkbox" checked={controls.apply_drainage_correction} onChange={(event) => setControls({ ...controls, apply_drainage_correction: event.target.checked })} className="mt-1 accent-emerald-200" /><span><span className="font-medium">AI drainage correction</span><span className="mt-1 block text-xs leading-5 text-white/45">Lift proxy misses near drainage-prone hotspots.</span></span></label><label className="block text-xs text-white/60"><span className="mb-2 block font-medium text-white/75">Free-text exposure · synthetic additions</span><textarea maxLength={4000} rows={3} value={controls.free_text} onChange={(event) => setControls({ ...controls, free_text: event.target.value })} placeholder="25 informal iron-sheet houses in Kibera, KES 800000 each" className="w-full resize-y rounded-xl border border-white/10 bg-[#0c1013] p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-200/50" /></label><button type="button" disabled={busy} onClick={() => void runModel()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-200 px-5 py-3 text-sm font-semibold text-[#0b1713] hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"><Play size={16} />{busy ? 'Working…' : 'Run model'}</button></div></section>
        {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-100"><span>{error}</span><button type="button" onClick={() => void load()} className="flex items-center gap-2 underline"><RefreshCw size={14} /> Retry</button></div>}
        {!run ? <div className={`${card} text-sm text-white/50`}>{busy ? 'Loading the latest model run…' : 'Start the model API to explore live results.'}</div> : <>
          {tab === 'Results' && <Results run={run} selected={selected} onSelect={selectLocation} />}
          {tab === 'AI layer' && <AiLayer run={run} />}
          {tab === 'Explain' && <Explain run={run} selected={selected} explanation={explanation} onSelect={setSelected} />}
          {tab === 'Assumptions' && <Assumptions run={run} audit={audit} />}
        </>}
      </main>
    </div>
  </div>
}

function Results({ run, selected, onSelect }: { run: RunResult; selected?: string; onSelect: (id: string) => void }) {
  const metrics = [
    ['Total insured value', run.metrics.total_tiv_kes], ['1-in-100 loss', run.metrics.loss_1_in_100_kes],
    ['1-in-250 loss', run.metrics.loss_1_in_250_kes], ['Annual average loss', run.metrics.aal_kes],
    ['AI delta · 1-in-100', run.metrics.ai_delta_1_in_100_kes],
  ] as const
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label, value]) => <div key={label} className={card}><p className={muted}>{label}</p><p className="mt-5 text-2xl font-semibold tracking-tight">{money(value)}</p></div>)}</div><div className="grid gap-5 xl:grid-cols-2"><section className={card}><Heading eyebrow="Exposure" title="Portfolio loss map" description="Click a location to open its explanation. Circle color shows annual loss cost." /><MapView run={run} selected={selected} onSelect={onSelect} /></section><section className={card}><Heading eyebrow="Financial engine" title="Exceedance probability curve" description="Current run against the uncorrected proxy baseline; years are assumed." /><EpChart run={run} /></section><section className={card}><Heading eyebrow="Vulnerability × exposure" title="Annual loss by housing class" /><ClassChart run={run} /></section><section className={card}><Heading eyebrow="Portfolio" title="Largest location AALs" /><div className="max-h-[320px] overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#141b1d] text-white/40"><tr><th className="py-2">Location</th><th>Class</th><th>Hotspot</th><th className="text-right">AAL</th></tr></thead><tbody>{run.top_locations.map((row) => <tr key={row.loc_id} onClick={() => onSelect(row.loc_id)} className="cursor-pointer border-t border-white/[0.07] text-white/70 hover:bg-white/5"><td className="py-2.5 text-emerald-200">{row.loc_id}</td><td>{clsLabel(row.housing_class)}</td><td>{row.nearest_hotspot}</td><td className="text-right tabular-nums">{money(row.aal_kes)}</td></tr>)}</tbody></table></div></section></div></div>
}

function AiLayer({ run }: { run: RunResult }) {
  return <div className="grid gap-5 xl:grid-cols-2"><section className={card}><Heading eyebrow="AI layer" title="Underwriter briefing" description="Generated from the current model run." /><div className="whitespace-pre-wrap text-sm leading-7 text-white/75">{run.briefing}</div></section><section className={card}><Heading eyebrow="Model impact" title="What changed" /><p className="text-sm leading-6 text-white/65">{run.ai.effect}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className={muted}>Drainage correction</p><p className="mt-2 text-lg font-semibold text-emerald-100">{run.ai.drainage.enabled ? 'Enabled' : 'Disabled'}</p><p className={muted}>{run.ai.drainage.buildings_uplifted} buildings uplifted</p></div><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className={muted}>1-in-100 loss change</p><p className="mt-2 text-lg font-semibold text-emerald-100">{money(run.ai.loss_delta_severe_kes)}</p><p className={muted}>Versus uncorrected proxy</p></div></div><p className={`mt-5 ${muted}`}>{run.ai.drainage.method}</p><p className={`mt-2 ${muted}`}>Missed hotspots: {run.ai.drainage.missed_hotspots.join(', ') || 'None'}</p><div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-medium">Free-text ingestion</h3><p className={`mt-2 ${muted}`}>{run.ai.free_text.rows_added} rows added · {run.ai.free_text.parsed ? 'Parsed' : 'No rows parsed'}</p>{run.ai.free_text.notes.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-white/50">{run.ai.free_text.notes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}</ul>}</div></section></div>
}

function Explain({ run, selected, explanation, onSelect }: { run: RunResult; selected?: string; explanation: Explanation | null; onSelect: (id: string) => void }) {
  const max = Math.max(1, ...(explanation?.contributions.map((item) => Math.abs(item.shap_kes)) ?? []))
  return <div className="grid gap-5 xl:grid-cols-2"><section className={card}><Heading eyebrow="Explainability" title="Global SHAP importance" description={`${run.explainability.note} Surrogate R²: ${run.explainability.surrogate_r2.toFixed(3)}.`} /><ShapGlobal run={run} /><label className="mt-4 block text-xs text-white/50">Inspect a location<select value={selected ?? ''} onChange={(event) => onSelect(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c1013] p-3 text-sm text-white"><option value="">Select a location</option>{run.locations.map((row) => <option key={row.loc_id} value={row.loc_id}>{row.loc_id} · {clsLabel(row.housing_class)}</option>)}</select></label></section><section className={card}><Heading eyebrow="Location detail" title="Local SHAP contribution" description="This explains a surrogate of annual average loss; the physics result remains authoritative." />{!explanation ? <p className="text-sm text-white/50">Select a location from the list or map to inspect its loss drivers.</p> : <><div className="mb-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-white/10 p-4"><p className={muted}>Physics AAL</p><p className="mt-2 font-semibold">{money(explanation.physics_aal_kes)}</p></div><div className="rounded-xl border border-white/10 p-4"><p className={muted}>Surrogate estimate</p><p className="mt-2 font-semibold">{money(explanation.surrogate_prediction_kes)}</p></div></div><p className="mb-4 text-sm font-medium text-emerald-100">{explanation.loc_id}</p><div className="space-y-4">{explanation.contributions.map((item) => <div key={item.feature}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="text-white/70">{clsLabel(item.feature)}</span><span className="tabular-nums text-white/60">{money(item.shap_kes)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className={`h-full rounded-full ${item.shap_kes < 0 ? 'bg-cyan-300' : 'bg-emerald-200'}`} style={{ width: `${Math.abs(item.shap_kes) / max * 100}%` }} /></div></div>)}</div></>}</section></div>
}

function Assumptions({ run, audit }: { run: RunResult; audit: Audit | null }) {
  return <div className="grid gap-5 xl:grid-cols-2"><section className={card}><Heading eyebrow="Model provenance" title="Data and assumptions" /><div className="space-y-4">{Object.entries(run.labels).map(([key, value]) => <div key={key} className="border-b border-white/[0.07] pb-3"><p className="text-xs font-medium capitalize text-white/75">{clsLabel(key)}</p><p className={`mt-1 ${muted}`}>{value}</p></div>)}{run.assumptions.map((item) => <div key={item.id} className="border-b border-white/[0.07] pb-3"><p className="text-xs font-medium text-white/75">{item.id} · {item.provenance} · {item.title}</p><p className={`mt-1 ${muted}`}>{item.statement}</p></div>)}</div><h3 className="mt-7 mb-3 text-sm font-semibold">Vulnerability matrix</h3><div className="space-y-3">{run.vulnerability_matrix.map((item) => <div key={item.housing_class} className="rounded-xl border border-white/10 p-4 text-xs"><p className="font-medium text-emerald-100">{clsLabel(item.housing_class)} · {pct(item.cap)} cap</p><p className="mt-2 text-white/50">{item.differs_from_jrc}</p><p className="mt-2 text-white/40">{Object.entries(item.by_depth_m).map(([depth, ratio]) => `${depth}m → ${pct(ratio, 0)}`).join(' · ')}</p></div>)}</div></section><section className={card}><Heading eyebrow="Reproducibility" title="Audit ledger" description="Run records are chained by hash in the model API." /><p className={`mb-4 rounded-lg border px-3 py-2 text-xs ${audit?.chain.ok ? 'border-emerald-200/20 bg-emerald-200/5 text-emerald-100' : 'border-white/10 text-white/50'}`}>{audit ? `Chain ${audit.chain.ok ? 'verified' : 'failed'} · ${audit.chain.entries ?? 0} runs` : 'Loading audit ledger…'}</p><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-white/40"><tr><th className="py-2">Run time</th><th>1-in-100 loss</th><th>Drainage AI</th></tr></thead><tbody>{audit?.ledger.slice(0, 20).map((row) => <tr key={row.run_id} className="border-t border-white/[0.07] text-white/65"><td className="py-3">{new Date(row.created_at).toLocaleString('en-KE')}</td><td>{money(row.metrics.loss_1_in_100_kes)}</td><td>{row.controls.apply_drainage_correction ? 'On' : 'Off'}</td></tr>)}</tbody></table></div></section></div>
}
