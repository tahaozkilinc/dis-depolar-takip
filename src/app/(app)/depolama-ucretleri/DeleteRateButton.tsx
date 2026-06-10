"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStorageRate } from "./actions";

export default function DeleteRateButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Bu ücreti silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      await deleteStorageRate(id);
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
