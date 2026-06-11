import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTL } from "@/lib/format";
import type { Carrier, Destination, PricingBasis, Profile, Warehouse } from "@/lib/types";
import PricingForm from "./PricingForm";
import DeleteAgreementButton from "./DeleteAgreementButton";

interface AgreementRow {
  id: string;
  basis: PricingBasis;
  unit_price: number;
  valid_from: string;
  valid_to: string | null;
  note: string | null;
  warehouses: { name: string } | null;
  destinations: { name: string } | null;
  carriers: { name: string } | null;
}

function basisLabel(basis: PricingBasis): string {
  return basis === "tonnage" ? "Tonaj Bazlı" : "Araç Bazlı";
}

export default async function FiyatAnlasmalariPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: profile }, { data: warehouses }, { data: destinations }, { data: carriers }, { data: agreements }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", session!.user.id).maybeSingle<Profile>(),
      supabase.from("warehouses").select("*").order("name"),
      supabase.from("destinations").select("*").order("name"),
      supabase.from("carriers").select("*").order("name"),
      supabase
        .from("pricing_agreements")
        .select(
          "id, basis, unit_price, valid_from, valid_to, note, warehouses(name), destinations(name), carriers(name)"
        )
        .order("warehouse_id")
        .order("valid_from", { ascending: false }),
    ]);

  const isViewer = profile?.role === "viewer";
  const rows = (agreements ?? []) as unknown as AgreementRow[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Fiyat Anlaşmaları
      </h1>

      {!isViewer && (
        <PricingForm
          warehouses={(warehouses ?? []) as Warehouse[]}
          destinations={(destinations ?? []) as Destination[]}
          carriers={(carriers ?? []) as Carrier[]}
        />
      )}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Depo</th>
              <th className="px-4 py-2">Varış</th>
              <th className="px-4 py-2">Nakliyeci</th>
              <th className="px-4 py-2">Fiyat Tipi</th>
              <th className="px-4 py-2 text-right">Birim Fiyat</th>
              <th className="px-4 py-2">Geçerlilik</th>
              <th className="px-4 py-2">Not</th>
              {!isViewer && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={isViewer ? 7 : 8} className="px-4 py-4 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.warehouses?.name ?? "-"}</td>
                <td className="px-4 py-2">{r.destinations?.name ?? "Tümü"}</td>
                <td className="px-4 py-2">{r.carriers?.name ?? "Tümü"}</td>
                <td className="px-4 py-2">{basisLabel(r.basis)}</td>
                <td className="px-4 py-2 text-right">
                  {formatTL(r.unit_price)}
                </td>
                <td className="px-4 py-2">
                  {formatDate(r.valid_from)} -{" "}
                  {r.valid_to ? formatDate(r.valid_to) : "Süresiz"}
                </td>
                <td className="px-4 py-2">{r.note ?? "-"}</td>
                {!isViewer && (
                  <td className="px-4 py-2 text-right">
                    <DeleteAgreementButton id={r.id} />
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
