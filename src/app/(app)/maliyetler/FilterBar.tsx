"use client";

import type { Warehouse } from "@/lib/types";

export default function FilterBar({
  warehouses,
  defaults,
}: {
  warehouses: Warehouse[];
  defaults: { warehouse_id?: string; from?: string; to?: string };
}) {
  return (
    <form
      method="get"
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Depo</label>
        <select
          name="warehouse_id"
          defaultValue={defaults.warehouse_id ?? ""}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Başlangıç</label>
        <input
          type="date"
          name="from"
          defaultValue={defaults.from ?? ""}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Bitiş</label>
        <input
          type="date"
          name="to"
          defaultValue={defaults.to ?? ""}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Hesapla
        </button>
      </div>
    </form>
  );
}
