"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { addCarrier } from "./actions";

export default function AddCarrierForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addCarrier(formData);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Yeni Nakliyeci</h2>
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nakliyeci Adı
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
