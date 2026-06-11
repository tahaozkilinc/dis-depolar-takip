import { createClient } from "@/lib/supabase/server";
import type { Carrier, Profile } from "@/lib/types";
import AddCarrierForm from "./AddCarrierForm";
import CarrierRow from "./CarrierRow";

export default async function NakliyecilerPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: carriers }, { data: profile }] = await Promise.all([
    supabase.from("carriers").select("*").order("name"),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session!.user.id)
      .maybeSingle<Profile>(),
  ]);

  const list = (carriers ?? []) as Carrier[];
  const readOnly = profile?.role !== "admin";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Nakliyeciler</h1>

      {!readOnly && <AddCarrierForm />}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Nakliyeci Adı</th>
              <th className="px-4 py-2 text-center">Aktif</th>
              {!readOnly && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 2 : 3} className="px-4 py-4 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {list.map((c) => (
              <CarrierRow key={c.id} carrier={c} readOnly={readOnly} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
