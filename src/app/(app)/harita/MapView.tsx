"use client";

import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Destination, Warehouse } from "@/lib/types";

const warehouseIcon = new Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#3D7A3E"/><circle cx="14" cy="14" r="6" fill="#fff"/></svg>`
    ),
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -36],
});

const destinationIcon = new Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#FBC02D"/><circle cx="14" cy="14" r="6" fill="#fff"/></svg>`
    ),
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -36],
});

export default function MapView({
  warehouses,
  destinations,
}: {
  warehouses: Warehouse[];
  destinations: Destination[];
}) {
  const points = [
    ...warehouses.map((w) => [w.latitude!, w.longitude!] as [number, number]),
    ...destinations.map((d) => [d.latitude!, d.longitude!] as [number, number]),
  ];
  const center: [number, number] =
    points.length > 0
      ? [
          points.reduce((s, p) => s + p[0], 0) / points.length,
          points.reduce((s, p) => s + p[1], 0) / points.length,
        ]
      : [39.0, 35.0];

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <MapContainer
        center={center}
        zoom={points.length > 0 ? 6 : 5}
        scrollWheelZoom
        style={{ height: "70vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {warehouses.map((w) => (
          <Marker key={`w-${w.id}`} position={[w.latitude!, w.longitude!]} icon={warehouseIcon}>
            <Popup>
              <strong>{w.name}</strong>
              <br />
              Depo
            </Popup>
          </Marker>
        ))}
        {destinations.map((d) => (
          <Marker key={`d-${d.id}`} position={[d.latitude!, d.longitude!]} icon={destinationIcon}>
            <Popup>
              <strong>{d.name}</strong>
              <br />
              Varış Noktası
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="flex gap-4 border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <span className="flex items-center gap-2">
          <Image src="/silo.svg" alt="" width={20} height={20} /> Depo
        </span>
        <span className="flex items-center gap-2">
          <Image src="/factory.svg" alt="" width={20} height={20} /> Varış Noktası (Fabrika)
        </span>
      </div>
    </div>
  );
}
