"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Product, Warehouse } from "@/lib/types";
import { addStockEntry } from "./actions";
import FormattedNumberInput from "../components/FormattedNumberInput";

export default function StockEntryForm({
  warehouses,
  products,
  fixedWarehouseId,
  fixedWarehouseName,
}: {
  warehouses: Warehouse[];
  products: Product[];
  fixedWarehouseId?: string | null;
  fixedWarehouseName?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warehouseText, setWarehouseText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const defaultProductId =
    products.find((p) => p.name.toLocaleUpperCase("tr-TR") === "MISIR")?.id ??
    "";

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    if (fixedWarehouseId) {
      formData.set("warehouse_id", fixedWarehouseId);
    } else {
      const typed = warehouseText.trim().toLocaleUpperCase("tr-TR");
      const match = warehouses.find(
        (w) => w.name.toLocaleUpperCase("tr-TR") === typed
      );
      if (!match) {
        setError("Depo bulunamadı. Listeden geçerli bir depo seçin.");
        return;
      }
      formData.set("warehouse_id", match.id);
    }
    startTransition(async () => {
      const res = await addStockEntry(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Stok girişi eklendi.");
        formRef.current?.reset();
        setWarehouseText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Yeni Stok Girişi
      </h2>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Depo
            </label>
            {fixedWarehouseId ? (
              <input
                type="text"
                disabled
                value={fixedWarehouseName ?? ""}
                className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
              />
            ) : (
              <>
                <input
                  type="text"
                  list="stock-warehouse-options"
                  value={warehouseText}
                  onChange={(e) => setWarehouseText(e.target.value)}
                  required
                  placeholder="Depo adı yazın"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <datalist id="stock-warehouse-options">
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name} />
                  ))}
                </datalist>
              </>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ürün
            </label>
            <select
              name="product_id"
              required
              defaultValue={defaultProductId}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Seçiniz</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tonaj
            </label>
            <FormattedNumberInput
              name="tonnage"
              decimals={4}
              maxDigits={20}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tarih
            </label>
            <input
              type="date"
              name="entry_date"
              defaultValue={today}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Not (opsiyonel)
            </label>
            <input
              type="text"
              name="note"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
