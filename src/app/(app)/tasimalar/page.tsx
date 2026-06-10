import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTon } from "@/lib/format";
import type { Destination, Product, Profile, Warehouse } from "@/lib/types";
import FilterBar from "./FilterBar";
import ExportButton from "./ExportButton";

interface ShipmentRow {
  id: string;
  shipment_date: string;
  vehicle_plate: string;
  tonnage: number;
  driver_name: string | null;
  notes: string | null;
  warehouses: { name: string } | null;
  products: { name: string } | null;
  destinations: { name: string } | null;
}

export default async function TasimalarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle<Profile>();

  const isAdmin = profile?.role === "admin";

  const [{ data: warehouses }, { data: products }, { data: destinations }] =
    await Promise.all([
      supabase.from("warehouses").select("*").order("name"),
      supabase.from("products").select("*").order("name"),
      supabase.from("destinations").select("*").order("name"),
    ]);

  const warehouseId = (params.warehouse_id as string) || "";
  const productId = (params.product_id as string) || "";
  const destinationId = (params.destination_id as string) || "";
  const from = (params.from as string) || "";
  const to = (params.to as string) || "";

  let query = supabase
    .from("shipments")
    .select(
      "id, shipment_date, vehicle_plate, tonnage, driver_name, notes, warehouses(name), products(name), destinations(name)"
    )
    .order("shipment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!isAdmin && profile?.warehouse_id) {
    query = query.eq("warehouse_id", profile.warehouse_id);
  } else if (isAdmin && warehouseId) {
    query = query.eq("warehouse_id", warehouseId);
  }

  if (productId) query = query.eq("product_id", productId);
  if (destinationId) query = query.eq("destination_id", destinationId);
  if (from) query = query.gte("shipment_date", from);
  if (to) query = query.lte("shipment_date", to);

  const { data: shipments } = await query.limit(1000);
  const rows = (shipments ?? []) as unknown as ShipmentRow[];

  const totalTonnage = rows.reduce((sum, r) => sum + Number(r.tonnage), 0);

  const exportRows = rows.map((r) => ({
    shipment_date: r.shipment_date,
    warehouse_name: r.warehouses?.name ?? "-",
    product_name: r.products?.name ?? "-",
    vehicle_plate: r.vehicle_plate,
    tonnage: r.tonnage,
    destination_name: r.destinations?.name ?? "-",
    driver_name: r.driver_name,
    notes: r.notes,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Taşımalar (Tonaj Listesi)
        </h1>
        <ExportButton rows={exportRows} />
      </div>

      <FilterBar
        warehouses={(warehouses ?? []) as Warehouse[]}
        products={(products ?? []) as Product[]}
        destinations={(destinations ?? []) as Destination[]}
        showWarehouse={isAdmin}
        defaults={{
          warehouse_id: warehouseId,
          product_id: productId,
          destination_id: destinationId,
          from,
          to,
        }}
      />

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Depo</th>
              <th className="px-4 py-2">Ürün</th>
              <th className="px-4 py-2">Plaka</th>
              <th className="px-4 py-2 text-right">Tonaj</th>
              <th className="px-4 py-2">Varış</th>
              <th className="px-4 py-2">Sürücü</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{formatDate(r.shipment_date)}</td>
                <td className="px-4 py-2">{r.warehouses?.name ?? "-"}</td>
                <td className="px-4 py-2">{r.products?.name ?? "-"}</td>
                <td className="px-4 py-2">{r.vehicle_plate}</td>
                <td className="px-4 py-2 text-right">{formatTon(r.tonnage)}</td>
                <td className="px-4 py-2">{r.destinations?.name ?? "-"}</td>
                <td className="px-4 py-2">{r.driver_name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-4 py-2" colSpan={4}>
                  Toplam
                </td>
                <td className="px-4 py-2 text-right">
                  {formatTon(totalTonnage)}
                </td>
                <td className="px-4 py-2" colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
