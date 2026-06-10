import { createClient } from "@/lib/supabase/server";
import type { Warehouse } from "@/lib/types";
import AddWarehouseForm from "./AddWarehouseForm";
import WarehouseRow from "./WarehouseRow";

export default async function DepolarPage() {
  const supabase = await createClient();
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .order("name");

  const list = (warehouses ?? []) as Warehouse[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Depolar</h1>

      <AddWarehouseForm />

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Depo Adı</th>
              <th className="px-4 py-2">Konum</th>
              <th className="px-4 py-2">Enlem / Boylam</th>
              <th className="px-4 py-2 text-center">Aktif</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {list.map((w) => (
              <WarehouseRow key={w.id} warehouse={w} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
