import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatTon } from "@/lib/format";
import PieChart, { PIE_COLORS } from "@/components/PieChart";
import type {
  Profile,
  WarehouseTotal,
  TodayShipmentsSummary,
} from "@/lib/types";

interface TodayShipmentRow {
  id: string;
  vehicle_plate: string;
  tonnage: number;
  warehouses: { name: string } | null;
  destinations: { name: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: totals }, { data: todaySummary }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session!.user.id)
        .maybeSingle<Profile>(),
      supabase.from("warehouse_totals").select("*"),
      supabase.from("today_shipments_summary").select("*"),
    ]);

  const isDepo = profile?.role === "depo";
  const myWarehouseId = profile?.warehouse_id ?? null;

  const filteredTotals: WarehouseTotal[] = (totals ?? []).filter(
    (w) => !isDepo || w.warehouse_id === myWarehouseId
  );

  const filteredSummary: TodayShipmentsSummary[] = (todaySummary ?? []).filter(
    (s) => !isDepo || s.warehouse_id === myWarehouseId
  );

  let todayShipmentsQuery = supabase
    .from("shipments")
    .select("id, vehicle_plate, tonnage, warehouses(name), destinations(name)")
    .eq("shipment_date", today)
    .order("created_at", { ascending: false });

  if (isDepo && myWarehouseId) {
    todayShipmentsQuery = todayShipmentsQuery.eq("warehouse_id", myWarehouseId);
  }

  const { data: todayShipments } = await todayShipmentsQuery;
  const todayShipmentRows = (todayShipments ?? []) as unknown as TodayShipmentRow[];

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
              className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm"
            >
              <Image src="/silo.svg" alt="" width={48} height={48} />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  {w.warehouse_name}
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatTon(w.total_remaining_tonnage)}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ton
                  </span>
                </div>
                <div className="text-xs text-gray-400">Kalan stok</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stock distribution pie chart */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Depo Bazlı Stok Dağılımı
        </h2>
        <PieChart
          segments={filteredTotals.map((w, i) => ({
            label: w.warehouse_name,
            value: Number(w.total_remaining_tonnage),
            color: PIE_COLORS[i % PIE_COLORS.length],
          }))}
          formatValue={(v) => `${formatTon(v)} ton`}
        />
      </section>

      {/* Today's shipments */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bugünkü Taşınan Tonaj (Depo Bazlı)
        </h2>
        {filteredSummary.length === 0 ? (
          <p className="text-sm text-gray-500">Bugün henüz sevkiyat yok.</p>
        ) : (
          <PieChart
            segments={filteredSummary.map((s, i) => ({
              label: s.warehouse_name,
              value: Number(s.total_tonnage),
              color: PIE_COLORS[i % PIE_COLORS.length],
            }))}
            formatValue={(v) => `${formatTon(v)} ton`}
          />
        )}
      </section>

      {/* Today's transfers (from -> to) */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bugünkü Taşımalar (Nereden - Nereye)
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          {todayShipmentRows.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Bugün henüz taşıma yok.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Depo</th>
                  <th className="px-4 py-2">Varış</th>
                  <th className="px-4 py-2">Plaka</th>
                  <th className="px-4 py-2 text-right">Tonaj</th>
                </tr>
              </thead>
              <tbody>
                {todayShipmentRows.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">{s.warehouses?.name ?? "-"}</td>
                    <td className="px-4 py-2">
                      {s.destinations?.name ?? "-"}
                    </td>
                    <td className="px-4 py-2">{s.vehicle_plate}</td>
                    <td className="px-4 py-2 text-right">
                      {formatTon(s.tonnage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
