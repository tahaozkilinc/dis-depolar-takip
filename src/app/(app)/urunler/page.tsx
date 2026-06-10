import { createClient } from "@/lib/supabase/server";
import type { Destination, Product } from "@/lib/types";
import CrudSection from "./CrudSection";
import {
  addProduct,
  deleteProduct,
  addDestination,
  deleteDestination,
} from "./actions";

export default async function UrunlerPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: destinations }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("destinations").select("*").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Ürünler &amp; Varış Noktaları
      </h1>

      <CrudSection
        title="Ürünler"
        items={(products ?? []) as Product[]}
        showUnit
        onAdd={addProduct}
        onDelete={deleteProduct}
      />

      <CrudSection
        title="Varış Noktaları"
        items={(destinations ?? []) as Destination[]}
        showUnit={false}
        onAdd={addDestination}
        onDelete={deleteDestination}
      />
    </div>
  );
}
