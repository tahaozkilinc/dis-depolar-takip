"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStockEntry } from "./actions";

export default function DeleteEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Bu stok girişini silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      await deleteStockEntry(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      Sil
    </button>
  );
}
