"use client";

import * as XLSX from "xlsx";
import { formatDate } from "@/lib/format";

interface ExportRow {
  shipment_date: string;
  shipment_time: string;
  warehouse_name: string;
  product_name: string;
  vehicle_plate: string;
  tonnage: number;
  destination_name: string;
  driver_name: string | null;
  notes: string | null;
}

export default function ExportButton({ rows }: { rows: ExportRow[] }) {
  function handleExport() {
    const data = rows.map((r) => ({
      Tarih: formatDate(r.shipment_date),
      Saat: r.shipment_time?.slice(0, 5) ?? "",
      Depo: r.warehouse_name,
      Ürün: r.product_name,
      Plaka: r.vehicle_plate,
      Tonaj: Number(r.tonnage),
      Varış: r.destination_name,
      Sürücü: r.driver_name ?? "",
      Not: r.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Taşımalar");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `tasimalar_${today}.xlsx`);
  }

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
    >
      Excel&apos;e Aktar
    </button>
  );
}
