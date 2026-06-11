import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatTL, formatTon } from "@/lib/format";
import type { Carrier, CarrierTotal, Profile } from "@/lib/types";
import ContactsEditor from "./ContactsEditor";
import ContractManager from "./ContractManager";

export default async function CarrierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: carrier }, { data: totals }, { data: profile }] =
    await Promise.all([
      supabase.from("carriers").select("*").eq("id", id).maybeSingle<Carrier>(),
      supabase
        .from("carrier_totals")
        .select("*")
        .eq("carrier_id", id)
        .maybeSingle<CarrierTotal>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session!.user.id)
        .maybeSingle<Profile>(),
    ]);

  if (!carrier) notFound();

  const readOnly = profile?.role !== "admin";

  let contractUrl: string | null = null;
  if (carrier.contract_path) {
    const { data } = await supabase.storage
      .from("carrier-contracts")
      .createSignedUrl(carrier.contract_path, 60 * 60);
    contractUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/nakliyeciler" className="text-sm text-brand-600 hover:underline">
          ← Nakliyeciler
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">
          {carrier.name}
        </h1>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Toplam Sevkiyat</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {totals?.shipment_count ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Taşınan Toplam Tonaj</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {formatTon(totals?.total_tonnage ?? 0)}{" "}
            <span className="text-sm font-normal text-gray-500">ton</span>
          </div>
        </div>
        <div className="rounded-lg border bg-brand-50 p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Toplam Ödenen Tutar (KDV Hariç)
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {formatTL(totals?.total_paid ?? 0)}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Firma Yetkilileri
        </h2>
        <ContactsEditor
          carrierId={carrier.id}
          contacts={carrier.contacts}
          readOnly={readOnly}
        />
      </section>

      {/* Contract */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Sözleşme (PDF)
        </h2>
        <ContractManager
          carrierId={carrier.id}
          contractUrl={contractUrl}
          readOnly={readOnly}
        />
      </section>
    </div>
  );
}
