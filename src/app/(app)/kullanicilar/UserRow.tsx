"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole, Warehouse } from "@/lib/types";
import { updateProfile } from "./actions";

export default function UserRow({
  profile,
  warehouses,
  assignedWarehouseIds,
  isSelf,
}: {
  profile: Profile;
  warehouses: Warehouse[];
  assignedWarehouseIds: string[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<UserRole>(profile.role);
  const [warehouseIds, setWarehouseIds] = useState<string[]>(assignedWarehouseIds);
  const [active, setActive] = useState(profile.active);
  const [error, setError] = useState<string | null>(null);

  function toggleWarehouse(id: string) {
    setWarehouseIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setWarehouseIds((prev) =>
      prev.length === warehouses.length ? [] : warehouses.map((w) => w.id)
    );
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(profile.id, {
        role,
        warehouse_ids: warehouseIds,
        active,
      });
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2">
        {profile.full_name ?? "-"}
        {isSelf && <span className="ml-1 text-xs text-gray-400">(siz)</span>}
      </td>
      <td className="px-4 py-2 text-gray-700">{profile.email ?? "-"}</td>
      <td className="px-4 py-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          disabled={isSelf}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
        >
          <option value="admin">Yönetici</option>
          <option value="depo">Depo</option>
          <option value="viewer">Görüntüleyici</option>
          <option value="operasyon">Operasyon (Stok)</option>
          <option value="operasyon_takip">Operasyon Takip</option>
        </select>
      </td>
      <td className="px-4 py-2">
        {role === "depo" || role === "operasyon_takip" ? (
          <div className="flex max-h-32 w-48 flex-col gap-1 overflow-y-auto rounded-md border border-gray-300 p-2">
            <label className="flex items-center gap-1.5 border-b pb-1 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={
                  warehouses.length > 0 && warehouseIds.length === warehouses.length
                }
                onChange={toggleAll}
                className="h-3.5 w-3.5"
              />
              Hepsi
            </label>
            {warehouses.map((w) => (
              <label key={w.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={warehouseIds.includes(w.id)}
                  onChange={() => toggleWarehouse(w.id)}
                  className="h-3.5 w-3.5"
                />
                {w.name}
              </label>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          disabled={isSelf}
          className="h-4 w-4"
        />
      </td>
      <td className="px-4 py-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md border px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
        >
          Kaydet
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
