import { createClient } from "@/lib/supabase/server";
import type { Profile, Warehouse } from "@/lib/types";
import UserRow from "./UserRow";

export default async function KullanicilarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: warehouses }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("warehouses").select("*").order("name"),
  ]);

  const list = (profiles ?? []) as Profile[];
  const warehouseList = (warehouses ?? []) as Warehouse[];
  const warehouseMap = new Map(warehouseList.map((w) => [w.id, w.name]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Kullanıcılar</h1>

      <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800">
        Yeni kullanıcılar /login sayfasından kayıt olduktan sonra burada
        listelenir. Onlara rol ve depo ataması yapabilirsiniz.
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Ad Soyad</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Depo</th>
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
            {list.map((p) => (
              <UserRow
                key={p.id}
                profile={p}
                warehouses={warehouseList}
                isSelf={p.id === user?.id}
              />
            ))}
          </tbody>
        </table>
      </div>
      {warehouseMap.size === 0 && (
        <p className="text-xs text-gray-500">
          Not: Henüz hiç depo tanımlanmamış. Depo ataması yapabilmek için
          önce &quot;Depolar&quot; sayfasından depo ekleyin.
        </p>
      )}
    </div>
  );
}
