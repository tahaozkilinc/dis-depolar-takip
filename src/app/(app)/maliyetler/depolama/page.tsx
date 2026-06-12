import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTL, formatTon } from "@/lib/format";
import type {
  DailyStorageCostToday,
  DailyStorageCostTodayByOwner,
  StorageCostPeriodByOwnerRow,
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

  const [{ data: warehouses }, { data: storageToday }, { data: storageTodayByOwner }] =
    await Promise.all([
      supabase.from("warehouses").select("*").order("name"),
      supabase.from("daily_storage_cost_today").select("*"),
      supabase.from("daily_storage_cost_today_by_owner").select("*"),
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

  const storageOwnerByWarehouse = new Map<
    string,
    Map<string, { owner_name: string; total_cost: number }>
  >();
  for (const row of (storageTodayByOwner ?? []) as DailyStorageCostTodayByOwner[]) {
    const ownerMap =
      storageOwnerByWarehouse.get(row.warehouse_id) ??
      new Map<string, { owner_name: string; total_cost: number }>();
    const key = row.owner_id ?? "null";
    const existing = ownerMap.get(key) ?? {
      owner_name: row.owner_name,
      total_cost: 0,
    };
    existing.total_cost += Number(row.storage_cost);
    ownerMap.set(key, existing);
    storageOwnerByWarehouse.set(row.warehouse_id, ownerMap);
  }

  const warehouseId =
    (params.warehouse_id as string) || warehouseList[0]?.id || "";
  const from = (params.from as string) || firstDayOfMonth();
  const to = (params.to as string) || today();

  let storageRows: StorageCostPeriodRow[] = [];
  let storageByOwnerRows: StorageCostPeriodByOwnerRow[] = [];

  if (warehouseId) {
    const [{ data: storageCost }, { data: storageCostByOwner }] = await Promise.all([
      supabase.rpc("storage_cost_period", {
        p_warehouse_id: warehouseId,
        p_start: from,
        p_end: to,
      }),
      supabase.rpc("storage_cost_period_by_owner", {
        p_warehouse_id: warehouseId,
        p_start: from,
        p_end: to,
      }),
    ]);
    storageRows = (storageCost ?? []) as StorageCostPeriodRow[];
    storageByOwnerRows = (storageCostByOwner ?? []) as StorageCostPeriodByOwnerRow[];
  }

  const storageTotal = storageRows.reduce(
    (sum, r) => sum + Number(r.storage_cost),
    0
  );

  const storageByOwner = new Map<string, { owner_name: string; total_cost: number }>();
  for (const r of storageByOwnerRows) {
    const key = r.owner_id ?? "null";
    const existing = storageByOwner.get(key) ?? {
      owner_name: r.owner_name,
      total_cost: 0,
    };
    existing.total_cost += Number(r.storage_cost);
    storageByOwner.set(key, existing);
  }
  const storageByOwnerTotal = Array.from(storageByOwner.values()).reduce(
    (sum, o) => sum + o.total_cost,
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
          {Array.from(storageByWarehouse.entries()).map(([id, w]) => {
            const ownerBreakdown = Array.from(
              storageOwnerByWarehouse.get(id)?.values() ?? []
            );
            return (
              <div
                key={id}
                className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
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
                {ownerBreakdown.length > 0 && (
                  <div className="border-t pt-2">
                    <div className="mb-1 text-xs font-medium text-gray-500">
                      Şirket Bazlı Kırılım
                    </div>
                    <ul className="flex flex-col gap-0.5 text-xs text-gray-600">
                      {ownerBreakdown.map((o, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>{o.owner_name}</span>
                          <span className="font-medium text-gray-800">
                            {formatTL(o.total_cost)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Storage costs by owner */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Şirket Bazlı Depolama Maliyeti (KDV Hariç)
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Sahip</th>
                <th className="px-4 py-2 text-right">Kesilecek Depolama Maliyeti</th>
              </tr>
            </thead>
            <tbody>
              {storageByOwner.size === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {Array.from(storageByOwner.entries()).map(([key, o]) => (
                <tr key={key} className="border-t">
                  <td className="px-4 py-2">{o.owner_name}</td>
                  <td className="px-4 py-2 text-right">{formatTL(o.total_cost)}</td>
                </tr>
              ))}
            </tbody>
            {storageByOwner.size > 0 && (
              <tfoot>
                <tr className="border-t bg-gray-50 font-semibold">
                  <td className="px-4 py-2">Toplam (KDV Hariç)</td>
                  <td className="px-4 py-2 text-right">
                    {formatTL(storageByOwnerTotal)}
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
