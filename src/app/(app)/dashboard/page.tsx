import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatTon } from "@/lib/format";
import PieChart, { PIE_COLORS } from "@/components/PieChart";
import StackedBarChart from "@/components/StackedBarChart";
import type {
  Profile,
  StockBalance,
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

  const [{ data: profile }, { data: totals }, { data: todaySummary }, { data: balances }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session!.user.id)
        .maybeSingle<Profile>(),
      supabase.from("warehouse_totals").select("*"),
      supabase.from("today_shipments_summary").select("*"),
      supabase.from("stock_balances").select("*"),
    ]);

  const isDepo = profile?.role === "depo";
  const myWarehouseId = profile?.warehouse_id ?? null;

  const filteredTotals: WarehouseTotal[] = (totals ?? []).filter(
    (w) => !isDepo || w.warehouse_id === myWarehouseId
  );

  const filteredSummary: TodayShipmentsSummary[] = (todaySummary ?? []).filter(
    (s) => !isDepo || s.warehouse_id === myWarehouseId
  );

  const todayTotalTonnage = filteredSummary.reduce(
    (sum, s) => sum + Number(s.total_tonnage),
    0
  );

  const filteredBalances: StockBalance[] = (balances ?? []).filter(
    (b) => !isDepo || b.warehouse_id === myWarehouseId
  );

  const stockByWarehouse = new Map<
    string,
    { warehouse_name: string; total_out: number; remaining: number }
  >();
  for (const b of filteredBalances) {
    const existing = stockByWarehouse.get(b.warehouse_id) ?? {
      warehouse_name: b.warehouse_name,
      total_out: 0,
      remaining: 0,
    };
    existing.total_out += Number(b.total_out);
    existing.remaining += Number(b.remaining_tonnage);
    stockByWarehouse.set(b.warehouse_id, existing);
  }

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

      {/* Today's total shipment tonnage */}
      <section className="rounded-lg border bg-brand-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              Bugünkü Toplam Sevkiyat
            </h2>
            <div className="text-xs text-gray-400">
              Tüm depolardan bugün çıkan toplam tonaj
            </div>
          </div>
          <div className="text-3xl font-bold text-brand-700">
            {formatTon(todayTotalTonnage)}{" "}
            <span className="text-base font-normal text-gray-500">ton</span>
          </div>
        </div>
      </section>

      {/* Çekilen vs kalan stock bar chart */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Depo Bazlı Stok Durumu (Çekilen / Kalan)
        </h2>
        <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500" /> Çekilen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-600" /> Kalan
          </span>
        </div>
        <StackedBarChart
          rows={Array.from(stockByWarehouse.values()).map((w) => ({
            label: w.warehouse_name,
            segments: [
              { label: "Çekilen", value: w.total_out, color: "#f59e0b" },
              { label: "Kalan", value: w.remaining, color: "#059669" },
            ],
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
