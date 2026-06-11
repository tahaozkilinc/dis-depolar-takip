"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUpperTR } from "@/lib/text";

export async function addCarrier(formData: FormData) {
  const supabase = await createClient();
  const name = toUpperTR((formData.get("name") as string)?.trim() ?? "");

  if (!name) return { error: "Nakliyeci adı zorunludur." };

  const { error } = await supabase
    .from("carriers")
    .insert({ name, active: true });

  if (error) return { error: error.message };
  revalidatePath("/nakliyeciler");
  revalidatePath("/tasima-girisi");
  revalidatePath("/fiyat-anlasmalari");
  return { success: true };
}

export async function updateCarrier(
  id: string,
  data: { name: string; active: boolean }
) {
  const supabase = await createClient();
  const payload = { name: toUpperTR(data.name.trim()), active: data.active };
  const { error } = await supabase
    .from("carriers")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nakliyeciler");
  revalidatePath("/tasima-girisi");
  revalidatePath("/fiyat-anlasmalari");
  return { success: true };
}

export async function deleteCarrier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("carriers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nakliyeciler");
  revalidatePath("/tasima-girisi");
  revalidatePath("/fiyat-anlasmalari");
  return { success: true };
}
