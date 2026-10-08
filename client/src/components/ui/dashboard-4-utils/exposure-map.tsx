import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { clsLabel, money } from '../../../features/model/format'
import type { LocationRow, RunResult } from '../../../features/model/types'
import { scenarioHazard, scenarioLabel, scenarioLoss, type Scenario } from './model'
import { Panel, PanelHeading } from './panel'
import { chartTheme, housingClassColor } from '../../../lib/chartTheme'

const mapHousingColors: Record<string, string> = {
  informal_iron_sheet: '#739CC9',
  semi_permanent: '#D59281',
  permanent_masonry: '#81B7AF',
  concrete_rcc: '#A2AEC0',
}

function mapHousingColor(housingClass: string) {
  return mapHousingColors[housingClass] ?? housingClassColor(housingClass)
}

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
    ...(location.coordinate_source ? [`Coordinate source: ${location.coordinate_source}`] : []),
    ...(location.address ? [`Address supplied: ${location.address}`] : []),
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
      opacity: 0.72,
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
    const maxTiv = Math.max(...run.locations.map((location) => location.tiv_kes).filter(Number.isFinite), 1)
    for (const hotspot of run.hotspots) {
      if (!Number.isFinite(hotspot.lat) || !Number.isFinite(hotspot.lon)) continue
      const detected = (hotspot.proxy_scores?.[scenario.tier] ?? 0) > 0
      hotspotMarkers.push(L.circleMarker([hotspot.lat, hotspot.lon], {
        radius: 8, color: detected ? chartTheme.success : chartTheme.danger, weight: 1.5, fillColor: detected ? chartTheme.success : chartTheme.danger, fillOpacity: 0.2,
      }).bindTooltip(`${hotspot.name} · ${detected ? 'proxy detects centre' : 'proxy misses centre'}`).addTo(layer))
    }
    for (const location of run.locations) {
      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) continue
      const loss = scenarioLoss(location, scenario.tier)
      const area = location.distance_to_hotspot_km <= 1.5 ? location.nearest_hotspot : 'Outside 1.5 km of named centres'
      if (selectedArea && area !== selectedArea) continue
      const color = mapHousingColor(location.housing_class)
      const tivRatio = Math.min(Math.max(location.tiv_kes, 0) / maxTiv, 1)
      const marker = L.circleMarker([location.lat, location.lon], {
        radius: 2.5 + Math.sqrt(tivRatio) * 4.5,
        color: '#FFFFFF',
        fillColor: color,
        fillOpacity: loss > 0 ? 0.85 : 0.58,
        opacity: 0.95,
        weight: 0.9,
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
        description={`Sample locations and the ${scenario.tier} susceptibility proxy over OpenStreetMap. The blue raster is not measured flood water.`}
        action={<span className="rounded-full border border-accent/20 bg-danger-tint px-3 py-1.5 text-[11px] text-danger">{scenario.affected_locations} affected</span>}
      />
      <div ref={container} className="mt-5 h-105 w-full overflow-hidden rounded-xl border border-border bg-surface-alt sm:h-130" role="application" aria-label="Interactive Nairobi portfolio map" />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-text-muted">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-white" style={{ backgroundColor: mapHousingColor('informal_iron_sheet') }} /> Informal iron-sheet</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-white" style={{ backgroundColor: mapHousingColor('semi_permanent') }} /> Semi-permanent</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-white" style={{ backgroundColor: mapHousingColor('permanent_masonry') }} /> Permanent masonry</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-white" style={{ backgroundColor: mapHousingColor('concrete_rcc') }} /> Concrete / RCC</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> Named centre detected</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-danger" /> Named centre missed</span>
        <span className="flex items-center gap-2"><span className="h-2 w-8 rounded-sm" style={{ backgroundImage: `linear-gradient(to right, ${chartTheme.sequential.join(', ')})` }} /> Proxy susceptibility</span>
        <span>Circle size indicates insured value; opacity indicates modelled loss</span>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4"><h3 className="text-sm font-semibold">Hotspot check</h3><p className="mt-2 text-2xl font-semibold text-text">{run.hazard_validation.detected_common} / {run.hazard_validation.checked}</p><p className="mt-1 text-xs leading-5 text-text-muted">Named centres detected by the common proxy raster. The county named {run.hazard_validation.county_named} areas; coordinates are available for {run.hazard_validation.checked}. {run.hazard_validation.coordinate_method}</p><p className="mt-3 text-xs font-medium text-text">All {run.hotspots.length} mapped centres <span className="font-normal text-text-muted">· select a name to locate it on the map</span></p><div className="mt-2 flex flex-wrap gap-1.5">{[...run.hotspots].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <button key={item.name} type="button" onClick={() => map.current?.flyTo([item.lat, item.lon], 15)} title={`${item.name}: common proxy ${item.proxy_detected_common ? 'detects' : 'misses'} centre`} className={`rounded-full px-2 py-1 text-[11px] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 ${item.proxy_detected_common ? 'bg-success/10 text-success focus-visible:outline-success' : 'bg-danger-tint text-danger focus-visible:outline-danger'}`}>{item.name}</button>)}</div><p className="mt-3 text-[11px] text-text-muted">Green: detected · red: missed · {run.hazard_validation.county_named - run.hazard_validation.checked} named areas have no coordinates in this dataset.</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><h3 className="text-sm font-semibold">Accumulation near named centres</h3><p className="mt-1 text-xs leading-5 text-text-muted">Sample locations within 1.5 km of an approximate hotspot centre. Select a row to filter the map. Values outside those circles stay separate.</p><div className="mt-3 max-h-64 overflow-y-auto"><table className="w-full text-left text-xs"><thead><tr><th className="py-2">Area</th><th className="text-right">TIV</th><th className="text-right">{scenarioLabel(scenario)} loss</th></tr></thead><tbody>{rankedAreas.map((row) => <tr key={row.name} onClick={() => setSelectedArea((current) => current === row.name ? null : row.name)} className={`cursor-pointer ${selectedArea === row.name ? 'text-brand-navy' : 'text-text'}`}><td className="py-2">{row.name} <span className="text-text-muted">({row.locations})</span></td><td className="text-right tabular-nums">{money(row.tiv)}</td><td className="text-right tabular-nums">{money(row.loss)}</td></tr>)}</tbody></table></div>{selectedArea && <button type="button" onClick={() => setSelectedArea(null)} className="mt-2 text-xs text-accent underline">Show all locations</button>}</div>
      </div>
    </Panel>
  )
}
