import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clsLabel, money } from '../../../features/model/format'
import type { LocationRow, RunResult } from '../../../features/model/types'
import { scenarioHazard, scenarioLabel, scenarioLoss, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'

function locationPopup(location: LocationRow, scenario: Scenario): HTMLElement {
  const content = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = location.loc_id
  content.append(title)
  for (const detail of [
    clsLabel(location.housing_class),
    `Modelled loss: ${money(scenarioLoss(location, scenario.tier))}`,
    `Insured value: ${money(location.tiv_kes)}`,
    `Proxy score: ${scenarioHazard(location, scenario.tier).toFixed(3)}`,
  ]) {
    const line = document.createElement('div')
    line.textContent = detail
    content.append(line)
  }
  return content
}

export function ExposureMap({ run, scenario }: {
  run: RunResult
  scenario: Scenario
}) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markers = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, { zoomControl: true, scrollWheelZoom: false }).setView([-1.286, 36.84], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(instance)
    map.current = instance
    markers.current = L.layerGroup().addTo(instance)
    const resize = window.setTimeout(() => instance.invalidateSize(), 100)
    return () => {
      window.clearTimeout(resize)
      instance.remove()
      map.current = null
      markers.current = null
    }
  }, [])

  useEffect(() => {
    const layer = markers.current
    const instance = map.current
    if (!layer || !instance) return
    layer.clearLayers()
    const bounds: L.LatLngTuple[] = []
    for (const hotspot of run.hotspots) {
      if (!Number.isFinite(hotspot.lat) || !Number.isFinite(hotspot.lon)) continue
      const label = document.createElement('span')
      label.textContent = hotspot.name
      L.circleMarker([hotspot.lat, hotspot.lon], {
        radius: 10, color: '#fcd34d', weight: 1, fillOpacity: 0.08,
      }).bindTooltip(label).addTo(layer)
    }
    for (const location of run.locations) {
      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) continue
      const loss = scenarioLoss(location, scenario.tier)
      const marker = L.circleMarker([location.lat, location.lon], {
        radius: loss > 0 ? 5 : 3,
        color: loss > 0 ? '#67e8f9' : '#94a3a8',
        fillColor: loss > 0 ? '#67e8f9' : '#94a3a8',
        fillOpacity: loss > 0 ? 0.7 : 0.3,
        weight: 1,
      }).bindPopup(locationPopup(location, scenario)).addTo(layer)
      const label = document.createElement('span')
      label.textContent = location.loc_id
      marker.bindTooltip(label)
      bounds.push([location.lat, location.lon])
    }
    if (bounds.length > 0) instance.fitBounds(bounds, { padding: [18, 18], maxZoom: 13 })
  }, [run, scenario])

  return (
    <Panel id="exposure-map" className="p-5 sm:col-span-2 sm:p-6">
      <PanelHeading
        eyebrow="Exposure"
        title="Nairobi portfolio map"
        description={`Portfolio locations with ${scenarioLabel(scenario)} modelled losses over OpenStreetMap.`}
        action={<span className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-[11px] text-cyan-100">{scenario.affected_locations} affected</span>}
      />
      <div ref={container} className="mt-5 h-[350px] w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e181b]" role="application" aria-label="Interactive Nairobi portfolio map" />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/45">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Modelled loss</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/40" /> No modelled loss</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-300" /> Named hotspot</span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-white/35">{run.metrics.synthetic_locations} of {run.metrics.locations} locations are declared synthetic. Map tiles show real geography; circles do not show measured inundation.</p>
    </Panel>
  )
}
