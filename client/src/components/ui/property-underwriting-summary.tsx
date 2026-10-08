import { ArrowRight, FileText, MapPin, ShieldAlert } from 'lucide-react'
import type { PropertyCalculation } from '../../features/model/api'
import { clsLabel, money } from '../../features/model/format'
import { Panel, PanelHeading } from './dashboard-4-utils/panel'
import type { DashboardSectionId } from './dashboard-sidebar'
import { SummaryLocationMap } from './summary-location-map'

const amount = (value: string | number) => money(Number(value))
const fullKes = (value: string | number) => `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(Number(value))}`
const documentAmount = (value?: string) => Number(value?.replace(/^KES\s*/i, '').replaceAll(',', ''))

export function PropertyUnderwritingSummary({ calculation, onNavigate }: { calculation: PropertyCalculation | null; onNavigate: (id: DashboardSectionId) => void }) {
  if (!calculation) return <Panel className="p-7 sm:p-9"><PanelHeading eyebrow="Property assessment" title="No property calculation yet" description="Upload a property offer in the model workspace, review its extracted values and calculate a loss. The result will appear here for that property." /><button type="button" onClick={() => onNavigate('workspace')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover">Open model workspace <ArrowRight size={16} /></button></Panel>

  const { assessment, result, tier } = calculation
  const fields = assessment.fields
  const model = assessment.financial_model
  const scenario = model?.scenarios.find((item) => item.tier === tier)
  const evidence = assessment.model_evidence
  const propertyName = fields.address?.value || fields.insured?.value || assessment.filename
  const floodExcluded = fields.coverage?.value.toLowerCase().includes('excluding flood')
  const allZero = model?.scenarios.every((item) => item.hazard_score === 0)
  const conflicts = [
    { label: 'Gross loss', stated: fields.gross_loss?.value, calculated: Number(result.gross_loss_kes) },
    { label: 'Net loss', stated: fields.net_loss?.value, calculated: Number(result.net_loss_kes) },
  ].filter((item) => item.stated && Number.isFinite(documentAmount(item.stated)) && Math.abs(documentAmount(item.stated) - item.calculated) > 0.01)
  const waterfall = [
    { label: 'Physical damage', value: Number(result.ground_up_loss_kes) },
    { label: 'Gross insured', value: Number(result.gross_loss_kes) },
    { label: 'After quota share', value: Number(result.retained_before_cat_kes) },
    { label: 'Net retained', value: Number(result.net_loss_kes) },
  ]
  const largest = Math.max(...waterfall.map((item) => item.value), 1)
  const checks = [
    ...(floodExcluded ? ['The offer appears to exclude flood. The loss calculation is conditional on flood cover being agreed.'] : []),
    ...(!fields.coverage ? ['Flood coverage was not confirmed from the document. Verify the policy wording.'] : []),
    ...(allZero ? ['The proxy has zero signal at this point in all five tiers. This does not establish that the property is flood safe.'] : []),
    ...(!fields.flood_deductible ? ['Deductible was not found in the document; confirm the entered threshold.'] : []),
    ...(!fields.limit ? ['Policy limit was not found in the document; confirm the entered limit.'] : []),
    ...(!fields.quota_share ? ['Quota share was not found in the document; confirm the assumed cession.'] : []),
    ...(!evidence ? ['Coordinates were not extracted; verify the property location.'] : evidence.proxy_covered ? [] : ['The extracted point falls outside the hazard proxy coverage.']),
    ...conflicts.map((item) => `${item.label} differs from the document: stated ${item.stated}; calculated ${amount(item.calculated)}.`),
  ]

  return <div className="space-y-5">
    <section className="rounded-xl bg-brand-navy p-6 text-white shadow-dashboard sm:p-8" aria-label="Assessed property">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">Property underwriting readout · illustrative</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{propertyName}</h2>
      <p className="mt-2 text-sm text-white/75">{fields.insured?.value || 'Insured not extracted'}{model ? ` · ${clsLabel(model.housing_class)}` : ''}{scenario ? ` · 1-in-${scenario.return_period_years} assumed scenario` : ' · entered occurrence loss'}</p>
      <div className="mt-6 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-3">
        <div><p className="text-xs text-white/65">Ground-up damage</p><p className="mt-2 text-2xl font-semibold tabular-nums">{amount(result.ground_up_loss_kes)}</p></div>
        <div><p className="text-xs text-white/65">Gross insured loss</p><p className="mt-2 text-2xl font-semibold tabular-nums">{amount(result.gross_loss_kes)}</p></div>
        <div><p className="text-xs text-white/65">Net retained loss</p><p className="mt-2 text-2xl font-semibold tabular-nums">{amount(result.net_loss_kes)}</p></div>
      </div>
      <p className="mt-5 text-xs text-white/70">{allZero ? 'All five hazard rasters have zero signal at this document point. The Ksh 0 model loss does not establish that the property is flood safe.' : 'This is a single-property, single-occurrence calculation. Gross and net amounts depend on the reviewed policy and treaty inputs.'}</p>
      {floodExcluded && <p className="mt-2 text-xs text-white/70">The uploaded offer excludes flood unless cover is separately agreed.</p>}
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Financial result" title="Loss waterfall" description="Physical damage through property terms and any selected treaty recovery." />
        <div className="mt-6 space-y-5">{waterfall.map((item) => <div key={item.label}><div className="flex justify-between gap-3 text-sm"><span>{item.label}</span><strong className="tabular-nums">{amount(item.value)}</strong></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-alt"><div className="h-full rounded-full bg-accent" style={{ width: `${item.value > 0 ? Math.max(item.value / largest * 100, 1) : 0}%` }} /></div></div>)}</div>
        <p className="mt-6 text-xs leading-5 text-text-muted">{result.basis}</p>
      </Panel>
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Risk identity" title="Property and model input" />
        <dl className="mt-4 divide-y divide-border/70 text-sm">
          <div className="py-3"><dt className="text-xs text-text-muted">Document</dt><dd className="mt-1 flex items-center gap-2 break-all font-medium"><FileText size={14} className="shrink-0 text-accent" />{assessment.filename}</dd></div>
          <div className="py-3"><dt className="text-xs text-text-muted">Stated insured value</dt><dd className="mt-1 font-medium">{model ? amount(model.tiv_kes) : fields.total_insured_value?.value || 'Not extracted'}</dd></div>
          <div className="py-3"><dt className="text-xs text-text-muted">Construction</dt><dd className="mt-1 font-medium">{model ? clsLabel(model.housing_class) : fields.construction?.value || 'Not confirmed'}</dd></div>
          <div className="py-3"><dt className="text-xs text-text-muted">Location</dt><dd className="mt-1 flex items-center gap-2 font-medium"><MapPin size={14} className="shrink-0 text-accent" />{evidence ? `${evidence.latitude}, ${evidence.longitude}` : 'Coordinates not extracted'}</dd></div>
          {scenario && <><div className="py-3"><dt className="text-xs text-text-muted">Proxy score at property</dt><dd className="mt-1 font-medium">{scenario.hazard_score.toFixed(2)}</dd></div><div className="py-3"><dt className="text-xs text-text-muted">Modelled damage ratio</dt><dd className="mt-1 font-medium">{(scenario.damage_ratio * 100).toFixed(1)}%</dd></div></>}
        </dl>
        {evidence && <a className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline" href={`https://www.openstreetmap.org/?mlat=${evidence.latitude}&mlon=${evidence.longitude}#map=16/${evidence.latitude}/${evidence.longitude}`} target="_blank" rel="noreferrer">View property point on map <ArrowRight size={14} /></a>}
      </Panel>
    </div>

    {evidence && <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Property location" title="Document point used by the model" description="The pin shows the coordinates extracted in the model workspace for this property calculation." />
      <SummaryLocationMap points={[{ id: propertyName, title: model ? clsLabel(model.housing_class) : fields.construction?.value || 'Assessed property', lat: evidence.latitude, lon: evidence.longitude, metrics: [
        ...(model ? [{ label: 'TIV', value: fullKes(model.tiv_kes) }] : fields.total_insured_value ? [{ label: 'TIV', value: fields.total_insured_value.value }] : []),
        ...(scenario ? [{ label: 'Hazard score', value: scenario.hazard_score.toFixed(2) }, { label: 'Damage ratio', value: `${(scenario.damage_ratio * 100).toFixed(1)}%` }] : []),
        { label: 'Ground-up loss', value: fullKes(result.ground_up_loss_kes) },
        { label: 'Gross insured', value: fullKes(result.gross_loss_kes) },
      ] }]} label="Interactive map of the assessed property" />
      <p className="mt-3 text-xs leading-5 text-text-muted">Source: {fields.coordinates?.source || 'Document extraction'}. Confirm this point against the property address before relying on the result.</p>
    </Panel>}

    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Applied terms" title="Coverage and retention" description="Amounts used for this property occurrence, including assumptions to verify." />
        <dl className="mt-4 divide-y divide-border/70 text-sm">
          <div className="flex justify-between gap-4 py-3"><dt>Deductible threshold</dt><dd className="font-semibold tabular-nums">{amount(result.deductible_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt>Deductible applied</dt><dd className="font-semibold tabular-nums">{amount(result.deductible_applied_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt>Policy limit</dt><dd className="font-semibold tabular-nums">{amount(result.policy_limit_kes)}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt>Quota share ceded</dt><dd className="font-semibold tabular-nums">{result.quota_share_ceded_pct}% · {amount(result.quota_share_recovery_kes)} recovery</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt>Cat XOL recovery</dt><dd className="font-semibold tabular-nums">{result.cat_xol_applies ? amount(result.cat_xol_recovery_kes) : 'Not applied'}</dd></div>
        </dl>
        {fields.coverage?.value && <p className="mt-4 rounded-lg bg-surface-alt p-3 text-xs leading-5">Document coverage: {fields.coverage.value}</p>}
      </Panel>
      <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Underwriter checks" title="Resolve before relying on the result" description="Property-specific coverage, location and calculation issues." />
        <ul className="mt-5 space-y-3 text-sm leading-5">{checks.length ? checks.map((check) => <li key={check} className="flex gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-accent" /><span>{check}</span></li>) : <li>Confirm the source document, coverage and model assumptions before use.</li>}</ul>
        {assessment.advice.checks.length > 0 && <div className="mt-5 border-t border-border pt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Document review checks</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-text-muted">{assessment.advice.checks.map((check) => <li key={check}>{check}</li>)}</ul></div>}
        <button type="button" onClick={() => onNavigate('workspace')} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">Review document and recalculate <ArrowRight size={14} /></button>
      </Panel>
    </div>

    {model && <Panel className="p-5 sm:p-6"><PanelHeading eyebrow="Property hazard" title="Physical damage across assumed scenarios" description="This is the same property at the extracted coordinates. Financial terms above apply only to the selected occurrence." /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-120 text-left text-xs"><thead className="bg-surface-alt text-text-muted"><tr><th className="px-3 py-2">Scenario</th><th className="px-3 py-2 text-right">Proxy score</th><th className="px-3 py-2 text-right">Damage ratio</th><th className="px-3 py-2 text-right">Ground-up loss</th></tr></thead><tbody>{model.scenarios.map((item) => <tr key={item.tier} className={`border-t border-border/70 ${item.tier === tier ? 'bg-danger-tint' : ''}`}><td className="px-3 py-2">1-in-{item.return_period_years}</td><td className="px-3 py-2 text-right">{item.hazard_score.toFixed(2)}</td><td className="px-3 py-2 text-right">{(item.damage_ratio * 100).toFixed(1)}%</td><td className="px-3 py-2 text-right font-medium">{amount(item.ground_up_loss_kes)}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs leading-5 text-text-muted">{model.basis} {model.construction_warning}</p></Panel>}
  </div>
}
