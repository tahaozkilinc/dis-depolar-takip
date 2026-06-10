import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTL, formatTon } from "@/lib/format";
import type {
  Profile,
  WarehouseTotal,
  TodayShipmentsSummary,
  DailyStorageCostToday,
} from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [
    { data: profile },
    { data: totals },
    { data: todaySummary },
    { data: storageToday },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session!.user.id)
      .maybeSingle<Profile>(),
    supabase.from("warehouse_totals").select("*"),
    supabase.from("today_shipments_summary").select("*"),
    supabase.from("daily_storage_cost_today").select("*"),
  ]);

  const isDepo = profile?.role === "depo";
  const myWarehouseId = profile?.warehouse_id ?? null;

  const filteredTotals: WarehouseTotal[] = (totals ?? []).filter(
    (w) => !isDepo || w.warehouse_id === myWarehouseId
  );

  const filteredSummary: TodayShipmentsSummary[] = (todaySummary ?? []).filter(
    (s) => !isDepo || s.warehouse_id === myWarehouseId
  );

  const storageRows: DailyStorageCostToday[] = (storageToday ?? []).filter(
    (s) => !isDepo || s.warehouse_id === myWarehouseId
  );

  // Group storage cost by warehouse
  const storageByWarehouse = new Map<
    string,
    { warehouse_name: string; total_remaining: number; total_cost: number }
  >();
  for (const row of storageRows) {
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {isDepo && (
        <div>
          <Link
            href="/tasima-girisi"
            className="inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Taşıma Girişi Yap
          </Link>
        </div>
      )}

      {/* Warehouse cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Depo Stok Durumu
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTotals.length === 0 && (
            <p className="text-sm text-gray-500">Veri bulunamadı.</p>
          )}
          {filteredTotals.map((w) => (
            <div
              key={w.warehouse_id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="text-sm font-medium text-gray-500">
                {w.warehouse_name}
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {formatTon(w.total_remaining_tonnage)}{" "}
                <span className="text-sm font-normal text-gray-500">ton</span>
              </div>
              <div className="text-xs text-gray-400">Kalan stok</div>
            </div>
          ))}
        </div>
      </section>

      {/* Today's shipments */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bugünkü Sevkiyatlar
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          {filteredSummary.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Bugün henüz sevkiyat yok.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Depo</th>
                  <th className="px-4 py-2 text-right">Sevkiyat Sayısı</th>
                  <th className="px-4 py-2 text-right">Toplam Tonaj</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.map((s) => (
                  <tr key={s.warehouse_id} className="border-t">
                    <td className="px-4 py-2">{s.warehouse_name}</td>
                    <td className="px-4 py-2 text-right">
                      {s.shipment_count}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatTon(s.total_tonnage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Today's estimated storage cost - admin sees all, depo sees own */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bugünkü Tahmini Depolama Maliyeti
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          {storageByWarehouse.size === 0 ? (
            <p className="p-4 text-sm text-gray-500">Veri bulunamadı.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Depo</th>
                  <th className="px-4 py-2 text-right">Kalan Tonaj</th>
                  <th className="px-4 py-2 text-right">Tahmini Maliyet</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(storageByWarehouse.entries()).map(
                  ([id, w]) => (
                    <tr key={id} className="border-t">
                      <td className="px-4 py-2">{w.warehouse_name}</td>
                      <td className="px-4 py-2 text-right">
                        {formatTon(w.total_remaining)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatTL(w.total_cost)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              {!isDepo && (
                <tfoot>
                  <tr className="border-t bg-gray-50 font-semibold">
                    <td className="px-4 py-2" colSpan={2}>
                      Genel Toplam
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatTL(storageGrandTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
