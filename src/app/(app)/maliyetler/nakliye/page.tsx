import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTL, formatTon } from "@/lib/format";
import type { PricingBasis, Warehouse } from "@/lib/types";
import FilterBar from "../FilterBar";

interface ShipmentCostRow {
  shipment_id: string;
  vehicle_plate: string;
  tonnage: number;
  shipment_date: string;
  basis: PricingBasis | null;
  unit_price: number | null;
  transport_cost: number | null;
  products: { name: string } | null;
  carriers: { name: string } | null;
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

export default async function NakliyeMaliyetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .order("name");

  const warehouseList = (warehouses ?? []) as Warehouse[];

  const warehouseId =
    (params.warehouse_id as string) || warehouseList[0]?.id || "";
  const from = (params.from as string) || firstDayOfMonth();
  const to = (params.to as string) || today();

  let transportRows: ShipmentCostRow[] = [];

  if (warehouseId) {
    const { data: shipmentCosts } = await supabase
      .from("shipment_costs")
      .select(
        "shipment_id, vehicle_plate, tonnage, shipment_date, basis, unit_price, transport_cost, products(name), carriers(name)"
      )
      .eq("warehouse_id", warehouseId)
      .gte("shipment_date", from)
      .lte("shipment_date", to)
      .order("shipment_date", { ascending: true });

    transportRows = (shipmentCosts ?? []) as unknown as ShipmentCostRow[];
  }

  const transportTotal = transportRows
    .filter((r) => r.transport_cost !== null)
    .reduce((sum, r) => sum + Number(r.transport_cost), 0);

  const noAgreementCount = transportRows.filter(
    (r) => r.transport_cost === null
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Nakliye Maliyet Raporu
      </h1>

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
                <th className="px-4 py-2">Nakliyeci</th>
                <th className="px-4 py-2 text-right">Tonaj</th>
                <th className="px-4 py-2">Fiyat Tipi</th>
                <th className="px-4 py-2 text-right">Birim Fiyat</th>
                <th className="px-4 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {transportRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {transportRows.map((r) => (
                <tr key={r.shipment_id} className="border-t">
                  <td className="px-4 py-2">{formatDate(r.shipment_date)}</td>
                  <td className="px-4 py-2">{r.vehicle_plate}</td>
                  <td className="px-4 py-2">{r.products?.name ?? "-"}</td>
                  <td className="px-4 py-2">{r.carriers?.name ?? "-"}</td>
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
                  <td className="px-4 py-2" colSpan={7}>
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
    </div>
  );
}
