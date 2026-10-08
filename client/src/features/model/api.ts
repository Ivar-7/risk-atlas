import type { Controls, Explanation, ExposurePreview, RunResult } from './types'

export const defaultControls: Controls = { apply_drainage_correction: true, free_text: '' }

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = ''
    try { detail = String((await response.json()).detail ?? '') } catch { /* use status */ }
    throw new Error(detail || `Model API returned ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const fetchLatest = () => fetch('/api/runs/latest').then(json<RunResult>)
export const fetchCapabilities = () => fetch('/api/capabilities').then(json<{ ai_exposure_available: boolean }>)
export const previewExposure = (free_text: string) => fetch('/api/exposure/preview', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_text }),
}).then(json<ExposurePreview>)
export const createRun = (controls: Controls) => fetch('/api/runs', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(controls),
}).then(json<RunResult>)
export const explainLocation = (runId: string, locId: string) =>
  fetch(`/api/runs/${encodeURIComponent(runId)}/explain/${encodeURIComponent(locId)}`).then(json<Explanation>)

export type Audit = { chain: { ok: boolean; entries: number }; ledger: Array<{
  run_id: string; created_at: string; metrics: { loss_1_in_100_kes: number }; controls: Controls
}> }
export const fetchAudit = () => fetch('/api/audit').then(json<Audit>)
