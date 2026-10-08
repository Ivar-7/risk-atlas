import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type SummaryMapPoint = {
  id: string
  title: string
  lat: number
  lon: number
  metrics: { label: string; value: string }[]
}

export function SummaryLocationMap({ points, label }: { points: SummaryMapPoint[]; label: string }) {
  const container = useRef<HTMLDivElement>(null)
  const validPoints = useMemo(() => points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180), [points])

  useEffect(() => {
    if (!container.current || !validPoints.length) return
    const map = L.map(container.current, { scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    const bounds: L.LatLngTuple[] = []
    validPoints.forEach((point) => {
      const coordinates: L.LatLngTuple = [point.lat, point.lon]
      const popup = document.createElement('div')
      const title = document.createElement('strong')
      title.className = 'risk-location-popup-title'
      title.textContent = point.title
      popup.append(title)
      const id = document.createElement('div')
      id.className = 'risk-location-popup-id'
      id.textContent = point.id
      popup.append(id)
      point.metrics.forEach((metric) => {
        const row = document.createElement('div')
        row.className = 'risk-location-popup-row'
        const label = document.createElement('span')
        label.textContent = metric.label
        const value = document.createElement('strong')
        value.textContent = metric.value
        row.append(label, value)
        popup.append(row)
      })
      L.circleMarker(coordinates, {
        radius: validPoints.length === 1 ? 9 : 6,
        color: '#FFFFFF',
        weight: 2,
        fillColor: '#d84d35',
        fillOpacity: 0.9,
      }).bindPopup(popup, { className: 'risk-location-popup', maxWidth: 300 }).bindTooltip(point.title).addTo(map)
      bounds.push(coordinates)
    })
    if (bounds.length === 1) map.setView(bounds[0], 16)
    else map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 })
    const resize = window.setTimeout(() => map.invalidateSize(), 100)
    return () => { window.clearTimeout(resize); map.remove() }
  }, [validPoints])

  if (!validPoints.length) return <p className="mt-5 rounded-lg bg-surface-alt p-4 text-sm text-text-muted">No usable coordinates were returned for this calculation.</p>
  return <div ref={container} className="mt-5 h-80 w-full overflow-hidden rounded-xl border border-border bg-surface-alt sm:h-100" role="application" aria-label={label} />
}
