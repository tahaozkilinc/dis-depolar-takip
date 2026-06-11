"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Carrier } from "@/lib/types";
import { updateCarrier, deleteCarrier } from "./actions";

export default function CarrierRow({
  carrier,
  readOnly,
}: {
  carrier: Carrier;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(carrier.name);
  const [active, setActive] = useState(carrier.active);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCarrier(carrier.id, { name, active });
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Bu nakliyeciyi silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await deleteCarrier(carrier.id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  if (readOnly) {
    return (
      <tr className="border-t">
        <td className="px-4 py-2 font-medium">
          <Link href={`/nakliyeciler/${carrier.id}`} className="text-brand-600 hover:underline">
            {carrier.name}
          </Link>
        </td>
        <td className="px-4 py-2 text-center">
          {carrier.active ? "Evet" : "Hayır"}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2">
        <div className="mb-1">
          <Link href={`/nakliyeciler/${carrier.id}`} className="text-xs text-brand-600 hover:underline">
            Profili Görüntüle
          </Link>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
            className="rounded-md border px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
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
