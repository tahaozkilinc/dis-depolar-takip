import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTL } from "@/lib/format";
import type { Profile, Warehouse } from "@/lib/types";
import StorageRateForm from "./StorageRateForm";
import DeleteRateButton from "./DeleteRateButton";

interface RateRow {
  id: string;
  price_per_ton_per_day: number;
  valid_from: string;
  valid_to: string | null;
  note: string | null;
  warehouses: { name: string } | null;
}

export default async function DepolamaUcretleriPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: profile }, { data: warehouses }, { data: rates }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", session!.user.id).maybeSingle<Profile>(),
    supabase.from("warehouses").select("*").order("name"),
    supabase
      .from("storage_rates")
      .select("id, price_per_ton_per_day, valid_from, valid_to, note, warehouses(name)")
      .order("warehouse_id")
      .order("valid_from", { ascending: false }),
  ]);

  const isViewer = profile?.role === "viewer";
  const rows = (rates ?? []) as unknown as RateRow[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Depolama Ücretleri
      </h1>

      {!isViewer && <StorageRateForm warehouses={(warehouses ?? []) as Warehouse[]} />}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Depo</th>
              <th className="px-4 py-2 text-right">Ton/Gün Ücreti</th>
              <th className="px-4 py-2">Geçerlilik</th>
              <th className="px-4 py-2">Not</th>
              {!isViewer && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={isViewer ? 4 : 5} className="px-4 py-4 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.warehouses?.name ?? "-"}</td>
                <td className="px-4 py-2 text-right">
                  {formatTL(r.price_per_ton_per_day)}
                </td>
                <td className="px-4 py-2">
                  {formatDate(r.valid_from)} -{" "}
                  {r.valid_to ? formatDate(r.valid_to) : "Süresiz"}
                </td>
                <td className="px-4 py-2">{r.note ?? "-"}</td>
                {!isViewer && (
                  <td className="px-4 py-2 text-right">
                    <DeleteRateButton id={r.id} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
