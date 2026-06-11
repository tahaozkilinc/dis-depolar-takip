import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTL, formatTon } from "@/lib/format";
import type {
  DailyStorageCostToday,
  PricingBasis,
  StorageCostPeriodRow,
  Warehouse,
} from "@/lib/types";
import FilterBar from "./FilterBar";

interface ShipmentCostRow {
  shipment_id: string;
  vehicle_plate: string;
  tonnage: number;
  shipment_date: string;
  basis: PricingBasis | null;
  unit_price: number | null;
  transport_cost: number | null;
  products: { name: string } | null;
}

function basisLabel(basis: PricingBasis | null): string {
  if (basis === "tonnage") return "Tonaj Bazlı";
  if (basis === "vehicle") return "Araç Bazlı";
  return "-";
}

function firstDayOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function MaliyetlerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: warehouses }, { data: storageToday }] = await Promise.all([
    supabase.from("warehouses").select("*").order("name"),
    supabase.from("daily_storage_cost_today").select("*"),
  ]);

  const warehouseList = (warehouses ?? []) as Warehouse[];

  const storageByWarehouse = new Map<
    string,
    { warehouse_name: string; total_remaining: number; total_cost: number }
  >();
  for (const row of (storageToday ?? []) as DailyStorageCostToday[]) {
    const existing = storageByWarehouse.get(row.warehouse_id) ?? {
      warehouse_name: row.warehouse_name,
      total_remaining: 0,
      total_cost: 0,
    };
    existing.total_remaining += Number(row.remaining_tonnage);
    existing.total_cost += Number(row.storage_cost);
    storageByWarehouse.set(row.warehouse_id, existing);
  }
  const storageGrandTotal = Array.from(storageByWarehouse.values()).reduce(
    (sum, w) => sum + w.total_cost,
    0
  );
  const warehouseId =
    (params.warehouse_id as string) || warehouseList[0]?.id || "";
  const from = (params.from as string) || firstDayOfMonth();
  const to = (params.to as string) || today();

  let transportRows: ShipmentCostRow[] = [];
  let storageRows: StorageCostPeriodRow[] = [];

  if (warehouseId) {
    const [{ data: shipmentCosts }, { data: storageCost }] =
      await Promise.all([
        supabase
          .from("shipment_costs")
          .select(
            "shipment_id, vehicle_plate, tonnage, shipment_date, basis, unit_price, transport_cost, products(name)"
          )
          .eq("warehouse_id", warehouseId)
          .gte("shipment_date", from)
          .lte("shipment_date", to)
          .order("shipment_date", { ascending: true }),
        supabase.rpc("storage_cost_period", {
          p_warehouse_id: warehouseId,
          p_start: from,
          p_end: to,
        }),
      ]);

    transportRows = (shipmentCosts ?? []) as unknown as ShipmentCostRow[];
    storageRows = (storageCost ?? []) as StorageCostPeriodRow[];
  }

  const transportTotal = transportRows
    .filter((r) => r.transport_cost !== null)
    .reduce((sum, r) => sum + Number(r.transport_cost), 0);

  const noAgreementCount = transportRows.filter(
    (r) => r.transport_cost === null
  ).length;

  const storageTotal = storageRows.reduce(
    (sum, r) => sum + Number(r.storage_cost),
    0
  );

  const grandTotal = transportTotal + storageTotal;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Maliyet Raporu</h1>

      {/* Today's storage cost cards per warehouse */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bugünkü Depolama Maliyeti (Depo Bazlı)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storageByWarehouse.size === 0 && (
            <p className="text-sm text-gray-500">Veri bulunamadı.</p>
          )}
          {Array.from(storageByWarehouse.entries()).map(([id, w]) => (
            <div
              key={id}
              className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm"
            >
              <Image src="/silo.svg" alt="" width={48} height={48} />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  {w.warehouse_name}
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {formatTL(w.total_cost)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatTon(w.total_remaining)} ton
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 rounded-lg border bg-brand-50 p-4 shadow-sm">
            <div>
              <div className="text-sm font-medium text-gray-500">
                Genel Toplam
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {formatTL(storageGrandTotal)}
              </div>
              <div className="text-xs text-gray-400">Tüm depolar</div>
            </div>
          </div>
        </div>
      </section>

      <FilterBar
        warehouses={warehouseList}
        defaults={{ warehouse_id: warehouseId, from, to }}
      />

      {/* Transport costs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Taşıma Maliyeti (KDV Hariç)
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Plaka</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2 text-right">Tonaj</th>
                <th className="px-4 py-2">Fiyat Tipi</th>
                <th className="px-4 py-2 text-right">Birim Fiyat</th>
                <th className="px-4 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {transportRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {transportRows.map((r) => (
                <tr key={r.shipment_id} className="border-t">
                  <td className="px-4 py-2">{formatDate(r.shipment_date)}</td>
                  <td className="px-4 py-2">{r.vehicle_plate}</td>
                  <td className="px-4 py-2">{r.products?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    {formatTon(r.tonnage)}
                  </td>
                  <td className="px-4 py-2">{basisLabel(r.basis)}</td>
                  <td className="px-4 py-2 text-right">
                    {r.unit_price !== null ? formatTL(r.unit_price) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.transport_cost !== null ? (
                      formatTL(r.transport_cost)
                    ) : (
                      <span className="text-amber-600">
                        Anlaşma bulunamadı
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {transportRows.length > 0 && (
              <tfoot>
                <tr className="border-t bg-gray-50 font-semibold">
                  <td className="px-4 py-2" colSpan={6}>
                    Toplam Taşıma Maliyeti (KDV Hariç)
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatTL(transportTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          {noAgreementCount > 0 && (
            <p className="border-t bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {noAgreementCount} sevkiyat için fiyat anlaşması bulunamadı,
              toplama dahil edilmedi.
            </p>
          )}
        </div>
      </section>

      {/* Storage costs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Depolama Maliyeti
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Gün</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2 text-right">Kalan Tonaj</th>
                <th className="px-4 py-2 text-right">Ton/Gün Ücreti</th>
                <th className="px-4 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {storageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {storageRows.map((r, i) => (
                <tr key={`${r.day}-${r.product_id}-${i}`} className="border-t">
                  <td className="px-4 py-2">{formatDate(r.day)}</td>
                  <td className="px-4 py-2">{r.product_name}</td>
                  <td className="px-4 py-2 text-right">
                    {formatTon(r.remaining_tonnage)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatTL(r.rate_per_ton)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatTL(r.storage_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
            {storageRows.length > 0 && (
              <tfoot>
                <tr className="border-t bg-gray-50 font-semibold">
                  <td className="px-4 py-2" colSpan={4}>
                    Toplam Depolama Maliyeti
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatTL(storageTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Grand total */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-base font-semibold text-gray-900">
          <span>Genel Toplam (KDV Hariç)</span>
          <span>{formatTL(grandTotal)}</span>
        </div>
      </section>
    </div>
  );
}
