import { useEffect, useRef, useState } from 'react'

const CLOUD_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4'
const LOCAL_VIDEO = '/hero.mp4'

function drawCover(ctx: CanvasRenderingContext2D, frame: ImageBitmap, width: number, height: number, dpr: number) {
  const scale = Math.max(width / frame.width, height / frame.height)
  const drawnWidth = frame.width * scale
  const drawnHeight = frame.height * scale
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(frame, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight)
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout)
      video.removeEventListener('seeked', done)
      video.removeEventListener('error', fail)
    }
    const done = () => { cleanup(); resolve() }
    const fail = () => { cleanup(); reject(new Error('Video seek failed')) }
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Video seek timed out')) }, 3000)
    video.addEventListener('seeked', done, { once: true })
    video.addEventListener('error', fail, { once: true })
    video.currentTime = time
  })
}

export default function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<ImageBitmap[]>([])
  const targetRef = useRef(0)
  const smoothedRef = useRef(0)
  const rafRef = useRef(0)
  const [source, setSource] = useState(CLOUD_VIDEO)
  const [hasFrame, setHasFrame] = useState(false)
  const [cacheReady, setCacheReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const draw = () => {
      const frames = framesRef.current
      if (!frames.length) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const pixelWidth = Math.round(rect.width * dpr)
      const pixelHeight = Math.round(rect.height * dpr)
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      const index = Math.min(frames.length - 1, Math.round(smoothedRef.current * (frames.length - 1)))
      drawCover(ctx, frames[index], rect.width, rect.height, dpr)
    }

    const tick = () => {
      const difference = targetRef.current - smoothedRef.current
      smoothedRef.current += difference * 0.12
      if (Math.abs(difference) < 0.0005) smoothedRef.current = targetRef.current
      if (framesRef.current.length) {
        draw()
      } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && Number.isFinite(video.duration)) {
        const time = smoothedRef.current * Math.max(0, video.duration - 0.05)
        if (!video.seeking && Math.abs(video.currentTime - time) > 0.04) video.currentTime = time
      }
      if (smoothedRef.current !== targetRef.current) rafRef.current = window.requestAnimationFrame(tick)
      else rafRef.current = 0
    }

    const onScroll = () => {
      const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      targetRef.current = Math.min(1, Math.max(0, window.scrollY / range))
      if (!rafRef.current) rafRef.current = window.requestAnimationFrame(tick)
    }
    const onSeeked = () => {
      if (!framesRef.current.length && !rafRef.current) rafRef.current = window.requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', draw)
    video.addEventListener('seeked', onSeeked)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', draw)
      video.removeEventListener('seeked', onSeeked)
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  useEffect(() => {
    if (!hasFrame) return
    let disposed = false
    let extractionVideo: HTMLVideoElement | null = null
    let produced: ImageBitmap[] = []

    const releaseVideo = () => {
      if (!extractionVideo) return
      extractionVideo.onloadeddata = null
      extractionVideo.onerror = null
      extractionVideo.pause()
      extractionVideo.removeAttribute('src')
      extractionVideo.load()
      extractionVideo = null
    }

    const extractFrom = async (url: string) => {
      const video = document.createElement('video')
      extractionVideo = video
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.src = url
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve()
        video.onerror = () => reject(new Error('Video loading failed'))
        video.load()
      })
      if (disposed) return
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) throw new Error('Video duration unavailable')
      const count = Math.min(90, Math.max(24, Math.round(duration * 12)))
      const width = Math.min(960, video.videoWidth)
      const height = Math.round(width * video.videoHeight / video.videoWidth)
      const work = document.createElement('canvas')
      work.width = width
      work.height = height
      const context = work.getContext('2d', { alpha: false })
      if (!context) throw new Error('Canvas unavailable')
      for (let i = 0; i < count && !disposed; i += 1) {
        if (i > 0) await seek(video, (i / (count - 1)) * Math.max(0, duration - 0.05))
        context.drawImage(video, 0, 0, width, height)
        produced.push(await createImageBitmap(work))
        if (i % 4 === 3) await new Promise((resolve) => window.setTimeout(resolve, 0))
      }
      if (disposed) return
      framesRef.current = produced
      setCacheReady(true)
      window.dispatchEvent(new Event('scroll'))
      releaseVideo()
    }

    const extract = async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 300))
      if (disposed) return
      try {
        await extractFrom(source)
      } catch (error) {
        produced.forEach((frame) => frame.close())
        produced = []
        releaseVideo()
        if (disposed || source === LOCAL_VIDEO) throw error
        await extractFrom(LOCAL_VIDEO)
      }
    }

    extract().catch((error) => {
      if (import.meta.env.DEV) console.warn('Scroll video frame cache unavailable:', error)
      produced.forEach((frame) => frame.close())
    })
    return () => {
      disposed = true
      releaseVideo()
      produced.forEach((frame) => frame.close())
      if (framesRef.current === produced) framesRef.current = []
    }
  }, [hasFrame, source])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]" aria-hidden="true">
      <img src="/hero-poster.jpg" alt="" className={`absolute inset-0 h-full w-full object-cover brightness-[0.55] transition-opacity duration-500 ${hasFrame || cacheReady ? 'opacity-0' : 'opacity-100'}`} />
      <video
        ref={videoRef}
        src={source}
        crossOrigin="anonymous"
        muted
        playsInline
        preload="auto"
        onLoadedData={() => { setHasFrame(true); window.dispatchEvent(new Event('scroll')) }}
        onError={() => { if (source !== LOCAL_VIDEO) { setHasFrame(false); setCacheReady(false); setSource(LOCAL_VIDEO) } }}
        className={`absolute inset-0 h-full w-full object-cover brightness-[0.55] transition-opacity duration-500 ${hasFrame && !cacheReady ? 'opacity-100' : 'opacity-0'}`}
      />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full brightness-[0.55] transition-opacity duration-500 ${cacheReady ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
