"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CarrierContact } from "@/lib/types";
import { updateCarrierContacts } from "../actions";

export default function ContactsEditor({
  carrierId,
  contacts,
  readOnly,
}: {
  carrierId: string;
  contacts: CarrierContact[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<CarrierContact[]>(
    contacts.length > 0
      ? contacts.map((c) => ({ name: c.name ?? "", role: c.role ?? "", phone: c.phone ?? "" }))
      : [{ name: "", role: "", phone: "" }]
  );
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, field: keyof CarrierContact, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", role: "", phone: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCarrierContacts(carrierId, rows);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  if (readOnly) {
    const filled = contacts.filter((c) => c.name || c.role || c.phone);
    if (filled.length === 0) {
      return <p className="text-sm text-gray-500">Yetkili bilgisi girilmemiş.</p>;
    }
    return (
      <ul className="flex flex-col gap-2 text-sm">
        {filled.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{c.name || "-"}</span>
            {c.role && <span className="text-gray-500">({c.role})</span>}
            {c.phone && <span className="text-gray-500">{c.phone}</span>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Ad Soyad"
            value={row.name}
            onChange={(e) => updateRow(i, "name", e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="Görev Tanımı"
            value={row.role}
            onChange={(e) => updateRow(i, "role", e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="Telefon"
            value={row.phone}
            onChange={(e) => updateRow(i, "phone", e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="rounded-md border px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Sil
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          + Yetkili Ekle
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
