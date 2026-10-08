import type { Controls, Explanation, ExposurePreview, RunResult } from './types'

export const defaultControls: Controls = { apply_drainage_correction: true, free_text: '' }
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''

function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, init)
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = ''
    try { detail = String((await response.json()).detail ?? '') } catch { /* use status */ }
    throw new Error(detail || `Model API returned ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const fetchLatest = () => apiFetch('/api/runs/latest').then(json<RunResult>)
export const fetchCapabilities = () => apiFetch('/api/capabilities').then(json<{ ai_exposure_available: boolean }>)
export const previewExposure = (free_text: string) => apiFetch('/api/exposure/preview', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_text }),
}).then(json<ExposurePreview>)
export const createRun = (controls: Controls) => apiFetch('/api/runs', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(controls),
}).then(json<RunResult>)
export const explainLocation = (runId: string, locId: string) =>
  apiFetch(`/api/runs/${encodeURIComponent(runId)}/explain/${encodeURIComponent(locId)}`).then(json<Explanation>)

export type Audit = { chain: { ok: boolean; entries: number }; ledger: Array<{
  run_id: string; created_at: string; metrics: { loss_1_in_100_kes: number }; controls: Controls
}> }
export const fetchAudit = () => apiFetch('/api/audit').then(json<Audit>)

export type DocumentField = { value: string; source: string; excerpt: string }
export type DocumentAssessment = {
  filename: string
  processing_ms: number
  fields: Record<string, DocumentField>
  missing: string[]
  model_evidence: { latitude: number; longitude: number; proxy_covered: boolean; tiers: Record<string, number> } | null
  advice: { status: string; summary: string; checks: string[] }
  limitations: string[]
}
export const analyzeDocument = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return apiFetch('/api/documents/analyze', { method: 'POST', body }).then(json<DocumentAssessment>)
}

export type LossTerms = {
  ground_up_loss_kes: string
  deductible_kes: string
  policy_limit_kes: string
  quota_share_ceded_pct: string
  cat_xol_applies: boolean
  cat_xol_attachment_kes: string | null
  cat_xol_limit_kes: string | null
}
export type LossCalculation = {
  ground_up_loss_kes: string
  deductible_kes: string
  policy_limit_kes: string
  gross_loss_kes: string
  quota_share_ceded_pct: string
  quota_share_recovery_kes: string
  retained_before_cat_kes: string
  cat_xol_applies: boolean
  cat_xol_attachment_kes: string | null
  cat_xol_limit_kes: string | null
  cat_xol_recovery_kes: string
  net_loss_kes: string
  basis: string
}
export const calculateDocumentLoss = (terms: LossTerms) => apiFetch('/api/loss/calculate', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(terms),
}).then(json<LossCalculation>)
