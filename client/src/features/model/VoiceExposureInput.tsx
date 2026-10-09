import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { transcribeExposure } from './api'

type VoiceState = 'idle' | 'starting' | 'recording' | 'transcribing'
type BrowserRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
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

export default function VoiceExposureInput({ disabled, onTranscript, onBusyChange, questionMode = false }: {
  disabled: boolean
  onTranscript: (text: string) => void
  onBusyChange: (busy: boolean) => void
  questionMode?: boolean
}) {
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState('')
  const [transcribedBy, setTranscribedBy] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const browserRef = useRef<BrowserRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const speechWindow = typeof window !== 'undefined' ? window as SpeechWindow : null
  const BrowserRecognition = speechWindow?.SpeechRecognition ?? speechWindow?.webkitSpeechRecognition
  const mediaSupported = typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const supported = Boolean(BrowserRecognition) || mediaSupported

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      browserRef.current?.abort()
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function stop() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    if (browserRef.current) {
      setState('transcribing')
      browserRef.current.stop()
      return
    }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  async function start() {
    if (!supported || disabled || state !== 'idle') return
    setError('')
    setTranscribedBy('')
    setState('starting')
    onBusyChange(true)
    if (BrowserRecognition && (!questionMode || !mediaSupported)) {
      try {
        const recognition = new BrowserRecognition()
        browserRef.current = recognition
        recognition.lang = 'en-KE'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1
        let heard = ''
        let failed = false
        recognition.onresult = (event) => {
          heard = Array.from(event.results, (result) => result[0]?.transcript ?? '').join(' ').trim()
        }
        recognition.onerror = (event) => {
          failed = true
          setError(event.error === 'not-allowed' ? 'Allow microphone access to use voice input.' : 'Browser speech recognition failed. Try again or type the exposure.')
          recognition.abort()
        }
        recognition.onend = () => {
          if (timerRef.current !== null) window.clearTimeout(timerRef.current)
          timerRef.current = null
          browserRef.current = null
          if (!mountedRef.current) return
          if (!failed && heard) { setTranscribedBy('browser speech recognition'); onTranscript(heard) }
          else if (!failed) setError('No speech was recognized. Try again or type the exposure.')
          setState('idle')
          onBusyChange(false)
        }
        recognition.start()
        setState('recording')
        timerRef.current = window.setTimeout(stop, 30_000)
      } catch {
        browserRef.current = null
        setError('Browser speech recognition could not start. You can type the exposure instead.')
        setState('idle')
        onBusyChange(false)
      }
      return
    }
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type))
      if (!preferred) throw new Error('unsupported audio format')
      const recorder = new MediaRecorder(stream, { mimeType: preferred })
      const chunks: Blob[] = []
      let recorderFailed = false
      streamRef.current = stream
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => {
        recorderFailed = true
        stop()
        setError('Microphone recording failed. Try again or type the exposure.')
        setState('idle')
        onBusyChange(false)
      }
      recorder.onstop = async () => {
        if (!mountedRef.current) return
        stream?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        if (recorderFailed) {
          setError('Microphone recording failed. Try again or type the exposure.')
          setState('idle')
          onBusyChange(false)
          return
        }
        const mediaType = recorder.mimeType || preferred || 'audio/webm'
        const extension = mediaType.startsWith('audio/mp4') ? 'mp4' : 'webm'
        const file = new File(chunks, `exposure.${extension}`, { type: mediaType })
        if (!file.size) {
          setError('No speech was recorded. Try again or type the exposure.')
          setState('idle')
          onBusyChange(false)
          return
        }
        setState('transcribing')
        try {
          const result = await transcribeExposure(file)
          if (mountedRef.current) { setTranscribedBy(result.model); onTranscript(result.text) }
        } catch (reason) {
          if (mountedRef.current) setError(reason instanceof Error ? reason.message : 'Could not transcribe the recording')
        } finally {
          if (mountedRef.current) { setState('idle'); onBusyChange(false) }
        }
      }
      recorder.start()
      setState('recording')
      timerRef.current = window.setTimeout(stop, 30_000)
    } catch (reason) {
      stream?.getTracks().forEach((track) => track.stop())
      setError(reason instanceof Error && reason.name === 'NotAllowedError' ? 'Allow microphone access to use voice input.' : 'Microphone recording could not start. You can type the exposure instead.')
      setState('idle')
      onBusyChange(false)
    }
  }

  return <div className="mt-3" aria-label={questionMode ? 'Voice question input' : 'Voice exposure input'}>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={state === 'recording' ? stop : () => void start()} disabled={disabled || !supported || state === 'starting' || state === 'transcribing'} className="inline-flex items-center gap-2 rounded-lg border border-accent px-3 py-2 text-xs font-semibold text-accent hover:bg-danger-tint disabled:cursor-not-allowed disabled:opacity-50">
        {state === 'recording' ? <Square size={14} fill="currentColor" /> : <Mic size={15} />}
        {state === 'recording' ? 'Stop and transcribe' : state === 'starting' ? 'Starting microphone…' : state === 'transcribing' ? 'Transcribing…' : questionMode ? 'Ask by voice' : 'Speak exposure'}
      </button>
      <span className="text-xs text-text-muted" role="status">{state === 'recording' ? 'Listening · stops after 30 seconds' : state === 'transcribing' ? BrowserRecognition && !questionMode ? 'Finishing browser transcription…' : 'Sending audio for transcription…' : transcribedBy ? `Transcribed by ${transcribedBy}. ${questionMode ? 'Review the question before sending.' : 'Review the offer text before modelling.'}` : questionMode ? 'Your words appear in the question box for review.' : BrowserRecognition ? 'Browser speech input is available; review the transcript before modelling.' : 'Your words appear in the offer box for review before modelling.'}</span>
    </div>
    {!supported && <p className="mt-2 text-xs text-warning">This browser cannot record audio here. Use a current browser on localhost or HTTPS, or type the offer.</p>}
    {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
  </div>
}
