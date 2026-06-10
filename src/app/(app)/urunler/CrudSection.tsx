"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  unit?: string;
}

export default function CrudSection({
  title,
  items,
  showUnit,
  onAdd,
  onDelete,
}: {
  title: string;
  items: Item[];
  showUnit: boolean;
  onAdd: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await onAdd(formData);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await onDelete(id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">{title}</h2>
      <form
        ref={formRef}
        action={handleAdd}
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ad
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {showUnit && (
          <div className="sm:w-32">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Birim
            </label>
            <input
              type="text"
              name="unit"
              defaultValue="ton"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Ekle
          </button>
        </div>
      </form>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Ad</th>
              {showUnit && <th className="px-4 py-2">Birim</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={showUnit ? 3 : 2}
                  className="px-4 py-4 text-center text-gray-500"
                >
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.name}</td>
                {showUnit && <td className="px-4 py-2">{item.unit}</td>}
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
