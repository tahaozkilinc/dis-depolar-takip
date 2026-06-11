"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadContract, deleteContract } from "../actions";

export default function ContractManager({
  carrierId,
  contractUrl,
  readOnly,
}: {
  carrierId: string;
  contractUrl: string | null;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await uploadContract(carrierId, formData);
      if (res?.error) setError(res.error);
      else {
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm("Sözleşmeyi silmek istediğinize emin misiniz?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteContract(carrierId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {contractUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={contractUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Sözleşmeyi Görüntüle
          </a>
          {!readOnly && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-md border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Sil
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Henüz sözleşme yüklenmemiş.</p>
      )}

      {!readOnly && (
        <form action={handleUpload} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? "Yükleniyor..." : "Yükle"}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
