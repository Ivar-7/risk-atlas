import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationRow, RunResult } from "./types";

function colorFor(lossCost: number) {
  if (lossCost >= 4) return "#fb7185";
  if (lossCost >= 1.5) return "#fbbf24";
  if (lossCost >= 0.4) return "#67e8f9";
  return "#a7f3d0";
}

type Props = {
  run: RunResult;
  selected?: string;
  onSelect: (id: string) => void;
};

export default function MapView({ run, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView([-1.286, 36.84], 12);
    // CARTO public tiles now show "API KEY REQUIRED". OSM and Esri do not need a key.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    run.hotspots.forEach((h) => {
      L.circleMarker([h.lat, h.lon], {
        radius: 10,
        color: "#a7f3d0",
        weight: 1,
        fillOpacity: 0.08,
      })
        .bindTooltip(h.name)
        .addTo(layer);
    });
    run.locations.forEach((loc: LocationRow) => {
      const marker = L.circleMarker([loc.lat, loc.lon], {
        radius: loc.loc_id === selected ? 9 : 5,
        color: colorFor(loc.loss_cost_pct),
        fillColor: colorFor(loc.loss_cost_pct),
        fillOpacity: loc.aal_kes > 0 ? 0.85 : 0.25,
        weight: loc.loc_id === selected ? 2 : 1,
      }).addTo(layer);
      marker.bindTooltip(`${loc.loc_id} · ${loc.housing_class.replaceAll("_", " ")}`);
      marker.on("click", () => onSelect(loc.loc_id));
    });
    return () => {
      map.removeLayer(layer);
    };
  }, [run, selected, onSelect]);

  return <div className="h-[360px] w-full rounded-xl bg-[#0e181b]" ref={ref} />;
}
