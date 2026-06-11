import { createClient } from "@/lib/supabase/server";
import type { Destination, Product, Profile } from "@/lib/types";
import CrudSection from "./CrudSection";
import {
  addProduct,
  deleteProduct,
  addDestination,
  deleteDestination,
  updateDestinationLocation,
} from "./actions";

export default async function UrunlerPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: products }, { data: destinations }, { data: profile }] =
    await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("destinations").select("*").order("name"),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session!.user.id)
        .maybeSingle<Profile>(),
    ]);

  const readOnly = profile?.role !== "admin";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Ürünler &amp; Varış Noktaları
      </h1>

      <CrudSection
        title="Ürünler"
        items={(products ?? []) as Product[]}
        showUnit
        readOnly={readOnly}
        onAdd={addProduct}
        onDelete={deleteProduct}
      />

      <CrudSection
        title="Varış Noktaları (Fabrika)"
        icon="/factory.svg"
        items={(destinations ?? []) as Destination[]}
        showUnit={false}
        showLatLng
        readOnly={readOnly}
        onAdd={addDestination}
        onDelete={deleteDestination}
        onUpdateLocation={updateDestinationLocation}
      />
    </div>
  );
}
