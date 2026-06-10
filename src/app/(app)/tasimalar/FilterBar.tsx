"use client";

import type { Destination, Product, Warehouse } from "@/lib/types";

export default function FilterBar({
  warehouses,
  products,
  destinations,
  showWarehouse,
  defaults,
}: {
  warehouses: Warehouse[];
  products: Product[];
  destinations: Destination[];
  showWarehouse: boolean;
  defaults: {
    warehouse_id?: string;
    product_id?: string;
    destination_id?: string;
    from?: string;
    to?: string;
  };
}) {
  return (
    <form
      method="get"
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
    >
      {showWarehouse && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Depo</label>
          <select
            name="warehouse_id"
            defaultValue={defaults.warehouse_id ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Tümü</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Ürün</label>
        <select
          name="product_id"
          defaultValue={defaults.product_id ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Tümü</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Varış</label>
        <select
          name="destination_id"
          defaultValue={defaults.destination_id ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Tümü</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
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
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Bitiş</label>
        <input
          type="date"
          name="to"
          defaultValue={defaults.to ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Filtrele
        </button>
      </div>
    </form>
  );
}
