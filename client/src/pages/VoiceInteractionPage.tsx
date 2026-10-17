import { memo, useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { LoaderCircle, Mic, MicOff } from 'lucide-react'
import { askVoice, transcribeExposure, type PropertyCalculation, type VoiceTurn } from '../features/model/api'
import type { RunResult } from '../features/model/types'

type Phase = 'idle' | 'starting' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error'
type BrowserRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition
  webkitSpeechRecognition?: new () => BrowserRecognition
}

const labels: Record<Exclude<Phase, 'error'>, string> = {
  idle: '', starting: 'Opening microphone…', listening: 'Listening · tap to send',
  transcribing: 'Transcribing…', thinking: 'Heard you · preparing answer…', speaking: 'Speaking · tap to stop',
}
const VoiceScene = memo(function VoiceScene() {
  return <Spline scene="https://prod.spline.design/oZqt8PQLGrwglf6H/scene.splinecode" />
})

export default function VoiceInteractionPage({ run, calculation }: { run: RunResult | null; calculation: PropertyCalculation | null }) {
  const [phase, setPhaseState] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const phaseRef = useRef<Phase>('idle')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<BrowserRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const historyRef = useRef<VoiceTurn[]>([])
  const operationRef = useRef(0)
  const mountedRef = useRef(true)
  const contextId = `${run?.run_id ?? ''}:${calculation?.assessment.filename ?? ''}:${calculation?.tier ?? ''}:${calculation?.result.net_loss_kes ?? ''}`

  function setPhase(next: Phase) {
    phaseRef.current = next
    if (mountedRef.current) setPhaseState(next)
  }
  function clearTimer() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }
  function releaseMicrophone() {
    clearTimer()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }
  function cancel() {
    operationRef.current += 1
    requestRef.current?.abort()
    requestRef.current = null
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.abort()
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder?.state === 'recording') recorder.stop()
    releaseMicrophone()
    window.speechSynthesis?.cancel()
    setPhase('idle')
  }

  useEffect(() => {
    historyRef.current = []
    if (phaseRef.current !== 'idle') cancel()
  }, [contextId])
  useEffect(() => {
    mountedRef.current = true
    const onVisible = () => {
      if (document.visibilityState === 'visible' && phaseRef.current === 'speaking') window.speechSynthesis?.resume()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      mountedRef.current = false
      document.removeEventListener('visibilitychange', onVisible)
      cancel()
    }
  }, [])

  function fail(message: string, operation: number) {
    if (operation !== operationRef.current || !mountedRef.current) return
    operationRef.current += 1
    requestRef.current?.abort()
    requestRef.current = null
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
    }
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder) {
      recorder.onerror = null
      recorder.onstop = null
      if (recorder.state === 'recording') recorder.stop()
    }
    releaseMicrophone()
    setError(message)
    setPhase('error')
  }

  function speak(text: string, operation: number) {
    if (!('speechSynthesis' in window)) {
      fail('Spoken answers are unavailable in this browser', operation)
      return
    }
    const chunks = text.match(/.{1,170}(?:\s|$)/g)?.map((part) => part.trim()).filter(Boolean) ?? [text]
    let index = 0
    setPhase('speaking')
    const next = () => {
      if (operation !== operationRef.current || !mountedRef.current) return
      if (index >= chunks.length) { setPhase('idle'); return }
      const utterance = new SpeechSynthesisUtterance(chunks[index++])
      utterance.lang = 'en-KE'
      utterance.rate = 0.95
      utterance.onend = next
      utterance.onerror = () => fail('Speech playback stopped. Tap the mic to try again.', operation)
      window.speechSynthesis.speak(utterance)
    }
    window.speechSynthesis.cancel()
    next()
  }

  async function ask(question: string, operation: number) {
    if (operation !== operationRef.current || !mountedRef.current) return
    const trimmed = question.trim()
    if (!trimmed) { fail('No speech heard. Tap the mic and try again.', operation); return }
    const history = [...historyRef.current, { role: 'user' as const, content: trimmed.slice(0, 2000) }].slice(-12)
    const controller = new AbortController()
    requestRef.current = controller
    setPhase('thinking')
    try {
      const response = await askVoice(history, run?.run_id ?? null, calculation, controller.signal)
      if (operation !== operationRef.current || !mountedRef.current) return
      requestRef.current = null
      historyRef.current = [...history, { role: 'assistant' as const, content: response.answer }].slice(-12)
      speak(response.answer, operation)
    } catch (reason) {
      if (operation !== operationRef.current) return
      fail(reason instanceof Error ? reason.message : 'Could not get an answer', operation)
    }
  }

  async function start() {
    if (!run && !calculation) return
    setError('')
    setPhase('starting')
    const operation = ++operationRef.current
    window.speechSynthesis?.cancel()
    const speechWindow = window as SpeechWindow
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    try {
      // Browser recognition avoids uploading audio and a separate transcription model call.
      if (Recognition) {
        const recognition = new Recognition()
        let transcript = ''
        let failed = false
        recognition.lang = 'en-KE'
        recognition.continuous = true
        recognition.interimResults = false
        recognition.onresult = (event) => {
          transcript = Array.from(event.results, (result) => result[0]?.transcript ?? '').join(' ').trim()
        }
        recognition.onerror = (event) => {
          failed = true
          fail(event.error === 'not-allowed' ? 'Allow microphone access to ask by voice.' : 'Speech recognition failed. Tap the mic to try again.', operation)
        }
        recognition.onend = () => {
          clearTimer()
          recognitionRef.current = null
          if (operation !== operationRef.current || failed) return
          void ask(transcript, operation)
        }
        recognitionRef.current = recognition
        recognition.start()
      } else {
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) throw new Error('Microphone input needs a supported browser on HTTPS or localhost')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (operation !== operationRef.current || !mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
        if (!mimeType) { stream.getTracks().forEach((track) => track.stop()); throw new Error('Audio recording is unavailable in this browser') }
        const recorder = new MediaRecorder(stream, { mimeType })
        const chunks: Blob[] = []
        streamRef.current = stream
        recorderRef.current = recorder
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
        recorder.onerror = () => fail('Recording failed. Tap the mic to try again.', operation)
        recorder.onstop = async () => {
          releaseMicrophone()
          recorderRef.current = null
          if (operation !== operationRef.current || !mountedRef.current) return
          const type = mimeType.startsWith('audio/mp4') ? 'audio/mp4' : 'audio/webm'
          const file = new File(chunks, `question.${type === 'audio/mp4' ? 'mp4' : 'webm'}`, { type })
          if (!file.size) { fail('No speech heard. Tap the mic and try again.', operation); return }
          const controller = new AbortController()
          requestRef.current = controller
          setPhase('transcribing')
          try {
            const result = await transcribeExposure(file, controller.signal)
            if (operation !== operationRef.current) return
            requestRef.current = null
            await ask(result.text, operation)
          } catch (reason) {
            if (operation !== operationRef.current) return
            fail(reason instanceof Error ? reason.message : 'Could not transcribe the question', operation)
          }
        }
        recorder.start()
      }
      if (operation !== operationRef.current) return
      setPhase('listening')
      timerRef.current = window.setTimeout(stop, 30_000)
    } catch (reason) {
      fail(reason instanceof Error ? reason.message : 'Could not start the microphone', operation)
    }
  }

  function stop() {
    clearTimer()
    if (phaseRef.current === 'starting') { cancel(); return }
    if (phaseRef.current !== 'listening') return
    setPhase('transcribing')
    const operation = operationRef.current
    const recorder = recorderRef.current
    const recognition = recognitionRef.current
    if (recorder?.state === 'recording') recorder.stop()
    else recognition?.stop()
    timerRef.current = window.setTimeout(() => {
      if (operation === operationRef.current && phaseRef.current === 'transcribing' && (recorderRef.current === recorder || recognitionRef.current === recognition)) {
        fail('Microphone stopped responding. Tap to try again.', operation)
      }
    }, 4000)
  }

  const active = phase === 'listening'
  const processing = phase === 'starting' || phase === 'transcribing' || phase === 'thinking'
  const label = phase === 'error' ? error : labels[phase]
  return <div className="relative h-full w-full" aria-label="Voice interaction scene">
    <VoiceScene />
    {label && <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-23 left-1/2 z-10 flex max-w-[min(90vw,360px)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 text-center text-xs font-medium text-text shadow-dashboard backdrop-blur-sm">
      {processing && <LoaderCircle size={14} className="shrink-0 animate-spin text-accent" />}
      <span className="truncate">{label}</span>
    </div>}
    <button type="button" aria-label={active ? 'Turn microphone off and ask' : processing || phase === 'speaking' ? 'Stop voice interaction' : 'Turn microphone on'} aria-pressed={active}
      title={active ? 'Turn microphone off and ask' : processing || phase === 'speaking' ? 'Stop voice interaction' : 'Turn microphone on'}
      disabled={!run && !calculation} onClick={active ? stop : phase === 'idle' || phase === 'error' ? () => void start() : cancel}
      className={`absolute bottom-7 left-1/2 z-10 flex size-12 -translate-x-1/2 items-center justify-center rounded-full border shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${active ? 'border-red-400 bg-red-500 text-white' : 'border-white/50 bg-white text-brand-navy hover:bg-surface-alt'}`}>
      {active ? <Mic size={21} /> : <MicOff size={21} />}
    </button>
  </div>
}
