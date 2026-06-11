"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole, Warehouse } from "@/lib/types";
import { updateProfile } from "./actions";

export default function UserRow({
  profile,
  warehouses,
  isSelf,
}: {
  profile: Profile;
  warehouses: Warehouse[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<UserRole>(profile.role);
  const [warehouseId, setWarehouseId] = useState(profile.warehouse_id ?? "");
  const [active, setActive] = useState(profile.active);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(profile.id, {
        role,
        warehouse_id: warehouseId || null,
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
        </select>
      </td>
      <td className="px-4 py-2">
        {role === "depo" ? (
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Seçiniz</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
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
