import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTon } from "@/lib/format";
import type {
  Carrier,
  Destination,
  Profile,
  StockBalance,
  Warehouse,
} from "@/lib/types";
import ShipmentForm from "./ShipmentForm";
import DeleteShipmentButton from "./DeleteShipmentButton";

interface ShipmentRow {
  id: string;
  shipment_date: string;
  shipment_time: string;
  vehicle_plate: string;
  tonnage: number;
  driver_name: string | null;
  created_by: string | null;
  products: { name: string } | null;
  destinations: { name: string } | null;
  carriers: { name: string } | null;
}

export default async function TasimaGirisiPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session!.user;

  const [
    { data: profile },
    { data: warehouses },
    { data: destinations },
    { data: carriers },
    { data: balances },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("warehouses").select("*").eq("active", true).order("name"),
    supabase.from("destinations").select("*").order("name"),
    supabase.from("carriers").select("*").eq("active", true).order("name"),
    supabase.from("stock_balances").select("*"),
  ]);

  if (!profile) {
    return (
      <p className="text-sm text-gray-600">
        Profiliniz oluşturuluyor, lütfen sayfayı yenileyin.
      </p>
    );
  }

  const isAdmin = profile.role === "admin";
  const isViewer = profile.role === "viewer";

  if (!isAdmin && !isViewer && !profile.warehouse_id) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">
          Hesabınıza henüz bir depo atanmamış. Lütfen yöneticinizle iletişime
          geçin.
        </p>
      </div>
    );
  }

  const fixedWarehouseId = isAdmin || isViewer ? null : profile.warehouse_id;
  const fixedWarehouseName = fixedWarehouseId
    ? (warehouses ?? []).find((w) => w.id === fixedWarehouseId)?.name ?? null
    : null;

  // For recent shipments table
  let shipmentsQuery = supabase
    .from("shipments")
    .select(
      "id, shipment_date, shipment_time, vehicle_plate, tonnage, driver_name, created_by, products(name), destinations(name), carriers(name)"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (fixedWarehouseId) {
    shipmentsQuery = shipmentsQuery.eq("warehouse_id", fixedWarehouseId);
  }

  const { data: shipments } = await shipmentsQuery;
  const shipmentRows = (shipments ?? []) as unknown as ShipmentRow[];

  const creatorIds = Array.from(
    new Set(shipmentRows.map((s) => s.created_by).filter(Boolean))
  ) as string[];
  const { data: creatorNames } =
    creatorIds.length > 0
      ? await supabase
          .from("profile_names")
          .select("id, full_name")
          .in("id", creatorIds)
      : { data: [] };
  const nameById = new Map(
    (creatorNames ?? []).map((p) => [p.id as string, p.full_name as string])
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Taşıma Girişi</h1>

      {!isViewer && (
        <ShipmentForm
          warehouses={(warehouses ?? []) as Warehouse[]}
          destinations={(destinations ?? []) as Destination[]}
          carriers={(carriers ?? []) as Carrier[]}
          balances={(balances ?? []) as StockBalance[]}
          fixedWarehouseId={fixedWarehouseId}
          fixedWarehouseName={fixedWarehouseName}
          lockDateTime={profile.role === "operasyon_takip"}
        />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Son Taşımalar
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Saat</th>
                <th className="px-4 py-2">Plaka</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2 text-right">Tonaj</th>
                <th className="px-4 py-2">Varış</th>
                <th className="px-4 py-2">Nakliyeci</th>
                <th className="px-4 py-2">Sürücü</th>
                <th className="px-4 py-2">Giriş Yapan</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shipmentRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {shipmentRows.map((s) => {
                const canDelete = !isViewer && (isAdmin || s.created_by === user.id);
                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">{formatDate(s.shipment_date)}</td>
                    <td className="px-4 py-2">{s.shipment_time?.slice(0, 5)}</td>
                    <td className="px-4 py-2">{s.vehicle_plate}</td>
                    <td className="px-4 py-2">{s.products?.name ?? "-"}</td>
                    <td className="px-4 py-2 text-right">
                      {formatTon(s.tonnage)}
                    </td>
                    <td className="px-4 py-2">{s.destinations?.name ?? "-"}</td>
                    <td className="px-4 py-2">{s.carriers?.name ?? "-"}</td>
                    <td className="px-4 py-2">{s.driver_name ?? "-"}</td>
                    <td className="px-4 py-2">
                      {s.created_by ? nameById.get(s.created_by) ?? "-" : "-"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {canDelete && <DeleteShipmentButton id={s.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
