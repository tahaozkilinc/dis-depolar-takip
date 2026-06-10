"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim() || "ton";
  if (!name) return { error: "Ürün adı zorunludur." };
  const { error } = await supabase.from("products").insert({ name, unit });
  if (error) return { error: error.message };
  revalidatePath("/urunler");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/urunler");
  return { success: true };
}

export async function addDestination(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Varış noktası adı zorunludur." };
  const { error } = await supabase.from("destinations").insert({ name });
  if (error) return { error: error.message };
  revalidatePath("/urunler");
  return { success: true };
}

export async function deleteDestination(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("destinations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/urunler");
  return { success: true };
}
