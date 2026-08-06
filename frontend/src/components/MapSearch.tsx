import { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Field } from "./form/Field";
import { Input } from "./ui/input";

// Fix default marker icons under Vite bundling.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface MapSearchValue {
  lat: number;
  lng: number;
  radiusKm: number;
}

interface MapSearchProps {
  value: MapSearchValue | null;
  onChange: (next: MapSearchValue) => void;
  className?: string;
  height?: string;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Radius map filter (PROP-06 MapSearch). Click map to set center. */
export function MapSearch({
  value,
  onChange,
  className,
  height = "280px",
}: MapSearchProps) {
  const center = value ?? { lat: 9.03, lng: 38.74, radiusKm: 5 };
  const [radius, setRadius] = useState(String(center.radiusKm));

  useEffect(() => {
    if (value) setRadius(String(value.radiusKm));
  }, [value]);

  function applyRadius(raw: string) {
    setRadius(raw);
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange({ lat: center.lat, lng: center.lng, radiusKm: n });
  }

  return (
    <div className={className}>
      <Field label="Search radius (km)">
        <Input
          type="number"
          min={0.5}
          step={0.5}
          value={radius}
          onChange={(e) => applyRadius(e.target.value)}
          aria-label="Search radius in kilometers"
        />
      </Field>
      <div className="mt-2 overflow-hidden rounded-lg border border-border" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler
            onPick={(lat, lng) =>
              onChange({ lat, lng, radiusKm: Number(radius) || center.radiusKm })
            }
          />
          <Marker position={[center.lat, center.lng]} icon={markerIcon} />
          <Circle
            center={[center.lat, center.lng]}
            radius={(Number(radius) || center.radiusKm) * 1000}
            pathOptions={{ color: "hsl(var(--primary))", fillOpacity: 0.12 }}
          />
        </MapContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Click the map to set the search center · {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
      </p>
    </div>
  );
}

/** Read-only map pane for a single property pin. */
export function PropertyMapPane({
  lat,
  lng,
  height = "200px",
}: {
  lat: number;
  lng: number;
  height?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}
