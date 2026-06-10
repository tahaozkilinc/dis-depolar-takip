"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Warehouse } from "@/lib/types";
import { updateWarehouse, deleteWarehouse } from "./actions";

export default function WarehouseRow({ warehouse }: { warehouse: Warehouse }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(warehouse.name);
  const [location, setLocation] = useState(warehouse.location ?? "");
  const [active, setActive] = useState(warehouse.active);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateWarehouse(warehouse.id, {
        name,
        location: location || null,
        active,
      });
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Bu depoyu silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await deleteWarehouse(warehouse.id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md border px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            Kaydet
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md border px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Sil
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
