import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Warehouse } from "@/lib/types";
import AddWarehouseForm from "./AddWarehouseForm";
import WarehouseRow from "./WarehouseRow";

export default async function DepolarPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: warehouses }, { data: profile }] = await Promise.all([
    supabase.from("warehouses").select("*").order("name"),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session!.user.id)
      .maybeSingle<Profile>(),
  ]);

  const list = (warehouses ?? []) as Warehouse[];
  const readOnly = profile?.role !== "admin" && profile?.role !== "operasyon";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Image src="/silo.svg" alt="" width={56} height={56} className="shrink-0" />
        <h1 className="text-xl font-semibold text-gray-900">Depolar</h1>
      </div>

      {!readOnly && <AddWarehouseForm />}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Depo Adı</th>
              <th className="px-4 py-2">Enlem / Boylam</th>
              <th className="px-4 py-2 text-center">Aktif</th>
              {!readOnly && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 3 : 4} className="px-4 py-4 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {list.map((w) => (
              <WarehouseRow key={w.id} warehouse={w} readOnly={readOnly} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
