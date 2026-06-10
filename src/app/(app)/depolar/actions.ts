"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addWarehouse(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const location = (formData.get("location") as string)?.trim() || null;

  if (!name) return { error: "Depo adı zorunludur." };

  const { error } = await supabase
    .from("warehouses")
    .insert({ name, location, active: true });

  if (error) return { error: error.message };
  revalidatePath("/depolar");
  return { success: true };
}

export async function updateWarehouse(
  id: string,
  data: { name: string; location: string | null; active: boolean }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("warehouses")
    .update(data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/depolar");
  return { success: true };
}

export async function deleteWarehouse(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("warehouses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/depolar");
  return { success: true };
}
