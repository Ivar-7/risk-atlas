import { useEffect, useRef, useState } from 'react'
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
  const overlay = useRef<L.ImageOverlay | null>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const areaRows = run.locations.reduce<Record<string, { name: string; locations: number; tiv: number; loss: number }>>((areas, location) => {
    const name = location.distance_to_hotspot_km <= 1.5 ? location.nearest_hotspot : 'Outside 1.5 km of named centres'
    const row = areas[name] ?? { name, locations: 0, tiv: 0, loss: 0 }
    row.locations += 1
    row.tiv += location.tiv_kes
    row.loss += scenarioLoss(location, scenario.tier)
    areas[name] = row
    return areas
  }, {})
  const rankedAreas = Object.values(areaRows).sort((a, b) => b.loss - a.loss)

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
      overlay.current = null
    }
  }, [])

  useEffect(() => {
    const layer = markers.current
    const instance = map.current
    if (!layer || !instance) return
    layer.clearLayers()
    if (overlay.current) instance.removeLayer(overlay.current)
    overlay.current = L.imageOverlay(`/assets/proxy-${scenario.tier}.png`, [[-1.45, 36.6], [-1.1, 37.0]], { opacity: 0.65, interactive: false }).addTo(instance)
    overlay.current.bringToBack()
    const bounds: L.LatLngTuple[] = []
    const hotspotMarkers: L.CircleMarker[] = []
    for (const hotspot of run.hotspots) {
      if (!Number.isFinite(hotspot.lat) || !Number.isFinite(hotspot.lon)) continue
      const detected = (hotspot.proxy_scores?.[scenario.tier] ?? 0) > 0
      hotspotMarkers.push(L.circleMarker([hotspot.lat, hotspot.lon], {
        radius: 8, color: detected ? '#86efac' : '#fb7185', weight: 2, fillColor: detected ? '#86efac' : '#fb7185', fillOpacity: 0.8,
      }).bindTooltip(`${hotspot.name} · ${detected ? 'proxy detects centre' : 'proxy misses centre'}`).addTo(layer))
    }
    for (const location of run.locations) {
      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) continue
      const loss = scenarioLoss(location, scenario.tier)
      const area = location.distance_to_hotspot_km <= 1.5 ? location.nearest_hotspot : 'Outside 1.5 km of named centres'
      if (selectedArea && area !== selectedArea) continue
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
    hotspotMarkers.forEach((marker) => marker.bringToFront())
    if (bounds.length > 0) instance.fitBounds(bounds, { padding: [18, 18], maxZoom: 13 })
  }, [run, scenario, selectedArea])

  return (
    <Panel id="exposure-map" className="p-5 sm:p-6">
      <PanelHeading
        eyebrow="Exposure"
        title="Nairobi portfolio map"
        description={`Synthetic locations and the ${scenario.tier} susceptibility proxy over OpenStreetMap. The blue raster is not measured flood water.`}
        action={<span className="rounded-full border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-[11px] text-cyan-100">{scenario.affected_locations} affected</span>}
      />
      <div ref={container} className="mt-5 h-[420px] w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e181b] sm:h-[520px]" role="application" aria-label="Interactive Nairobi portfolio map" />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/45">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Modelled loss</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/40" /> No modelled loss</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" /> Proxy susceptibility</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-300" /> Named centre detected</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" /> Named centre missed</span>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-border/70 p-4"><h3 className="text-sm font-semibold">Hotspot check</h3><p className="mt-2 text-2xl font-semibold text-foreground">{run.hazard_validation.detected_common} / {run.hazard_validation.checked}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Named centres detected by the common proxy raster. The county named {run.hazard_validation.county_named} areas; coordinates are available for {run.hazard_validation.checked}. {run.hazard_validation.coordinate_method}</p><div className="mt-3 flex flex-wrap gap-1.5">{run.hotspots.filter((item) => !item.proxy_detected_common).map((item) => <span key={item.name} className="rounded-full bg-rose-400/10 px-2 py-1 text-[11px] text-rose-200">{item.name}</span>)}</div></div>
        <div className="rounded-lg border border-border/70 p-4"><h3 className="text-sm font-semibold">Accumulation near named centres</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Synthetic locations within 1.5 km of an approximate hotspot centre. Select a row to filter the map. Values outside those circles stay separate.</p><div className="mt-3 max-h-64 overflow-y-auto"><table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-2">Area</th><th className="text-right">TIV</th><th className="text-right">{scenarioLabel(scenario)} loss</th></tr></thead><tbody>{rankedAreas.map((row) => <tr key={row.name} onClick={() => setSelectedArea((current) => current === row.name ? null : row.name)} className={`cursor-pointer border-t border-border/50 hover:bg-white/5 ${selectedArea === row.name ? 'text-primary' : 'text-foreground/75'}`}><td className="py-2">{row.name} <span className="text-muted-foreground">({row.locations})</span></td><td className="text-right tabular-nums">{money(row.tiv)}</td><td className="text-right tabular-nums">{money(row.loss)}</td></tr>)}</tbody></table></div>{selectedArea && <button type="button" onClick={() => setSelectedArea(null)} className="mt-2 text-xs text-primary underline">Show all locations</button>}</div>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-white/45">{run.metrics.synthetic_locations} of {run.metrics.locations} locations are declared synthetic. The blue source raster is uncorrected; location losses include the drainage rule when enabled. Map tiles show real geography, and no circle shows measured inundation.</p>
    </Panel>
  )
}
