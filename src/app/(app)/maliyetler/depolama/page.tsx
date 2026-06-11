import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTL, formatTon } from "@/lib/format";
import type {
  DailyStorageCostToday,
  StorageCostPeriodRow,
  Warehouse,
} from "@/lib/types";
import FilterBar from "../FilterBar";

function firstDayOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DepolamaMaliyetPage({
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

  let storageRows: StorageCostPeriodRow[] = [];

  if (warehouseId) {
    const { data: storageCost } = await supabase.rpc("storage_cost_period", {
      p_warehouse_id: warehouseId,
      p_start: from,
      p_end: to,
    });
    storageRows = (storageCost ?? []) as StorageCostPeriodRow[];
  }

  const storageTotal = storageRows.reduce(
    (sum, r) => sum + Number(r.storage_cost),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Depolama Maliyet Raporu
      </h1>

      {/* Today's storage cost cards per warehouse */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bugünkü Depolama Maliyeti (Depo Bazlı, KDV Hariç)
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

      {/* Storage costs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Depolama Maliyeti (KDV Hariç)
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
                    Toplam Depolama Maliyeti (KDV Hariç)
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
    </div>
  );
}
