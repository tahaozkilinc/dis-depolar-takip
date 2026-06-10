"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  unit?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function CrudSection({
  title,
  items,
  showUnit,
  showLatLng,
  onAdd,
  onDelete,
  onUpdateLocation,
}: {
  title: string;
  items: Item[];
  showUnit: boolean;
  showLatLng?: boolean;
  onAdd: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
  onUpdateLocation?: (
    id: string,
    data: { latitude: number | null; longitude: number | null }
  ) => Promise<{ error?: string; success?: boolean }>;
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
        {showLatLng && (
          <>
            <div className="sm:w-28">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Enlem
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="41.0082"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="sm:w-28">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Boylam
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="28.9784"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </>
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
              {showLatLng && <th className="px-4 py-2">Enlem / Boylam</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={showUnit || showLatLng ? 3 : 2}
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
                {showLatLng && onUpdateLocation && (
                  <td className="px-4 py-2">
                    <LocationCell item={item} onUpdateLocation={onUpdateLocation} />
                  </td>
                )}
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

function LocationCell({
  item,
  onUpdateLocation,
}: {
  item: Item;
  onUpdateLocation: (
    id: string,
    data: { latitude: number | null; longitude: number | null }
  ) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [latitude, setLatitude] = useState(item.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(item.longitude?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const lat = latitude.trim() ? Number(latitude) : null;
      const lng = longitude.trim() ? Number(longitude) : null;
      const res = await onUpdateLocation(item.id, {
        latitude: lat !== null && Number.isFinite(lat) ? lat : null,
        longitude: lng !== null && Number.isFinite(lng) ? lng : null,
      });
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        step="any"
        placeholder="Enlem"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <input
        type="number"
        step="any"
        placeholder="Boylam"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-md border px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
      >
        Kaydet
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
