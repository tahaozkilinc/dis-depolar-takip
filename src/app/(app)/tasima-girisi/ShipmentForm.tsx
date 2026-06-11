"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  Carrier,
  Destination,
  StockBalance,
  StockOwnerBalance,
  Warehouse,
} from "@/lib/types";
import { addShipment } from "./actions";
import { formatTon } from "@/lib/format";
import FormattedNumberInput from "../components/FormattedNumberInput";
import PlateInput from "../components/PlateInput";

function currentTime(): string {
  return new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ShipmentForm({
  warehouses,
  destinations,
  carriers,
  balances,
  ownerBalances,
  fixedWarehouseId,
  fixedWarehouseName,
  lockDateTime,
}: {
  warehouses: Warehouse[];
  destinations: Destination[];
  carriers: Carrier[];
  balances: StockBalance[];
  ownerBalances: StockOwnerBalance[];
  fixedWarehouseId: string | null;
  fixedWarehouseName: string | null;
  lockDateTime?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    fixedWarehouseId ?? ""
  );
  const [selectedProduct, setSelectedProduct] = useState("");
  const [tonnage, setTonnage] = useState("");
  const [shipmentTime, setShipmentTime] = useState(currentTime);
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const productOptions = useMemo(() => {
    return balances.filter(
      (b) => b.warehouse_id === selectedWarehouse && b.remaining_tonnage > 0
    );
  }, [balances, selectedWarehouse]);

  const effectiveSelectedProduct = productOptions.some(
    (p) => p.product_id === selectedProduct
  )
    ? selectedProduct
    : productOptions[0]?.product_id ?? "";

  const selectedBalance = productOptions.find(
    (p) => p.product_id === effectiveSelectedProduct
  );

  const ownerBreakdown = useMemo(() => {
    return ownerBalances.filter(
      (o) =>
        o.warehouse_id === selectedWarehouse &&
        o.product_id === effectiveSelectedProduct &&
        o.remaining_tonnage > 0
    );
  }, [ownerBalances, selectedWarehouse, effectiveSelectedProduct]);

  const overLimit =
    selectedBalance &&
    tonnage &&
    parseFloat(tonnage) > selectedBalance.remaining_tonnage;

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    if (fixedWarehouseId) {
      formData.set("warehouse_id", fixedWarehouseId);
    }
    startTransition(async () => {
      const res = await addShipment(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Sevkiyat kaydedildi.");
        formRef.current?.reset();
        setSelectedProduct("");
        setTonnage("");
        setShipmentTime(currentTime());
        if (!fixedWarehouseId) setSelectedWarehouse("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Yeni Taşıma Kaydı
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
              <select
                name="warehouse_id"
                required
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value);
                  setSelectedProduct("");
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seçiniz</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ürün
            </label>
            <select
              name="product_id"
              required
              value={effectiveSelectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={!selectedWarehouse}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
            >
              <option value="">Seçiniz</option>
              {productOptions.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} (Kalan: {formatTon(p.remaining_tonnage)} ton)
                </option>
              ))}
            </select>
            {selectedWarehouse && productOptions.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Bu depoda kalan stoğu olan ürün bulunamadı.
              </p>
            )}
            {ownerBreakdown.length > 0 && (
              <div className="mt-1 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
                <span className="font-medium">Sahiplik: </span>
                {ownerBreakdown
                  .map((o) => `${o.owner_name}: ${formatTon(o.remaining_tonnage)} ton`)
                  .join(", ")}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Araç Plakası
            </label>
            <PlateInput
              name="vehicle_plate"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
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
              value={tonnage}
              onValueChange={setTonnage}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {overLimit && (
              <p className="mt-1 text-xs text-amber-600">
                Uyarı: Girilen tonaj, depodaki kalan stoktan ({formatTon(
                  selectedBalance!.remaining_tonnage
                )}{" "}
                ton) fazla.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Varış Noktası
            </label>
            <select
              name="destination_id"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Seçiniz</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tarih
            </label>
            {lockDateTime ? (
              <>
                <input type="hidden" name="shipment_date" value={today} />
                <input
                  type="text"
                  disabled
                  value={today}
                  className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                />
              </>
            ) : (
              <input
                type="date"
                name="shipment_date"
                defaultValue={today}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Saat
            </label>
            {lockDateTime ? (
              <>
                <input type="hidden" name="shipment_time" value={shipmentTime} />
                <input
                  type="text"
                  disabled
                  value={shipmentTime}
                  className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                />
              </>
            ) : (
              <input
                type="time"
                name="shipment_time"
                required
                value={shipmentTime}
                onChange={(e) => setShipmentTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nakliyeci (opsiyonel)
            </label>
            <select
              name="carrier_id"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Seçiniz</option>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sürücü Adı (opsiyonel)
            </label>
            <input
              type="text"
              name="driver_name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Not (opsiyonel)
            </label>
            <input
              type="text"
              name="notes"
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
