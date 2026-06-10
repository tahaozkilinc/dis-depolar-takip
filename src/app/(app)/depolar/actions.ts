"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseCoordinate(value: FormDataEntryValue | null): number | null {
  const trimmed = (value as string)?.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export async function addWarehouse(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const location = (formData.get("location") as string)?.trim() || null;
  const latitude = parseCoordinate(formData.get("latitude"));
  const longitude = parseCoordinate(formData.get("longitude"));

  if (!name) return { error: "Depo adı zorunludur." };

  const { error } = await supabase
    .from("warehouses")
    .insert({ name, location, active: true, latitude, longitude });

  if (error) return { error: error.message };
  revalidatePath("/depolar");
  return { success: true };
}

export async function updateWarehouse(
  id: string,
  data: {
    name: string;
    location: string | null;
    active: boolean;
    latitude: number | null;
    longitude: number | null;
  }
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
