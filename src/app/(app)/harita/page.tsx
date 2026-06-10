import { createClient } from "@/lib/supabase/server";
import type { Destination, Warehouse } from "@/lib/types";
import MapView from "./MapViewClient";

export default async function HaritaPage() {
  const supabase = await createClient();
  const [{ data: warehouses }, { data: destinations }] = await Promise.all([
    supabase.from("warehouses").select("*").order("name"),
    supabase.from("destinations").select("*").order("name"),
  ]);

  const warehousePoints = ((warehouses ?? []) as Warehouse[]).filter(
    (w) => w.latitude != null && w.longitude != null
  );
  const destinationPoints = ((destinations ?? []) as Destination[]).filter(
    (d) => d.latitude != null && d.longitude != null
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Harita</h1>
      {warehousePoints.length === 0 && destinationPoints.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          Henüz konum bilgisi girilmiş depo veya varış noktası yok. Depolar ve
          Ürünler &amp; Varış Noktaları sayfalarından enlem/boylam ekleyebilirsiniz.
        </div>
      ) : (
        <MapView warehouses={warehousePoints} destinations={destinationPoints} />
      )}
    </div>
  );
}
