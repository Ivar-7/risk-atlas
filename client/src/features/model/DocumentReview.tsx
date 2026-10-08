import { useRef, useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { analyzeDocument, type DocumentAssessment } from './api'

export default function DocumentReview({ onReviewed }: { onReviewed: (assessment: DocumentAssessment) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function inspect(file: File) {
    setBusy(true)
    setError('')
    try { onReviewed(await analyzeDocument(file)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read document') }
    finally { setBusy(false) }
  }

  return <section className="rounded-xl border border-border bg-surface p-5 text-text shadow-dashboard sm:p-6">
    <div className="flex items-start gap-3"><FileText className="mt-1 shrink-0 text-accent" size={21} /><div><h2 className="font-semibold">Read property document</h2><p className="mt-1 text-xs leading-5 text-text-muted">Upload a PDF or Word offer. Extracted figures and coordinates appear below for verification.</p></div></div>
    <div onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void inspect(file) }} className={`mt-4 rounded-xl border border-dashed p-5 text-center ${dragging ? 'border-accent bg-danger-tint' : 'border-input-border bg-surface'}`}>
      <Upload size={20} className="mx-auto text-text-muted" /><p className="mt-2 text-xs text-text-muted">Drop a PDF or .docx, or choose a file · 10 MB max</p>
      <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void inspect(file); event.target.value = '' }} aria-label="Choose a property document" />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Reading…' : 'Choose file'}</button>
    </div>
    {error && <p role="alert" className="mt-3 rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{error}</p>}
  </section>
}
