import type { Controls, CoordinatePreview, Explanation, ExposurePreview, RunResult } from './types'

export const defaultControls: Controls = { apply_drainage_correction: false, free_text: '', deductible_pct: 0, policy_limit_pct: 100, quota_share_ceded_pct: 0, cat_xol_applies: false }
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''
let tokenGetter: (() => Promise<string | null>) | null = null

export function setApiTokenGetter(getToken: (() => Promise<string | null>) | null): void {
  tokenGetter = getToken
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await tokenGetter?.()
  if (!token) throw new Error('Sign in to access the model API')
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${apiBaseUrl}${path}`, { ...init, headers })
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
const refreshes = new Map<string, Promise<RunResult>>()
export function refreshSavedRun(runId: string): Promise<RunResult> {
  const existing = refreshes.get(runId)
  if (existing) return existing
  const request = apiFetch(`/api/runs/${encodeURIComponent(runId)}/refresh`, { method: 'POST' }).then(json<RunResult>)
  refreshes.set(runId, request)
  void request.finally(() => refreshes.delete(runId)).catch(() => undefined)
  return request
}
export const fetchCapabilities = () => apiFetch('/api/capabilities').then(json<{ ai_exposure_available: boolean }>)
export const previewExposure = (free_text: string) => apiFetch('/api/exposure/preview', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_text }),
}).then(json<ExposurePreview>)
export const transcribeExposure = (file: File, signal?: AbortSignal) => {
  const body = new FormData()
  body.append('file', file)
  return apiFetch('/api/exposure/transcribe', { method: 'POST', body, signal }).then(json<{ text: string; model: string }>)
}
export type VoiceTurn = { role: 'user' | 'assistant'; content: string }
export const askVoice = (history: VoiceTurn[], runId: string | null, propertyCalculation: PropertyCalculation | null, signal?: AbortSignal) => apiFetch('/api/voice/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ history: history.slice(-12), run_id: runId, property_calculation: propertyCalculation }),
  signal,
}).then(json<{ answer: string; provider: string; model: string }>)
export const previewCoordinates = (file: File, previewId: string) => {
  const body = new FormData()
  body.append('file', file)
  body.append('preview_id', previewId)
  return apiFetch('/api/exposure/coordinates/preview', { method: 'POST', body }).then(json<CoordinatePreview>)
}
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
  financial_model: {
    tiv_kes: number
    housing_class: string
    basis: string
    construction_warning: string
    scenarios: Array<{ tier: string; source_tier: string; return_period_years: number; annual_exceedance: number; hazard_score: number; damage_ratio: number; ground_up_loss_kes: number }>
  } | null
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
  deductible_applied_kes: string
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
export type PropertyCalculation = { assessment: DocumentAssessment; terms: LossTerms; tier: string; result: LossCalculation }
export const calculateDocumentLoss = (terms: LossTerms) => apiFetch('/api/loss/calculate', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(terms),
}).then(json<LossCalculation>)
