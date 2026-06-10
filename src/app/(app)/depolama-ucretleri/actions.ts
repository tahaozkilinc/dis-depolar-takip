"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addStorageRate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const warehouse_id = formData.get("warehouse_id") as string;
  const price_per_ton_per_day = parseFloat(
    formData.get("price_per_ton_per_day") as string
  );
  const valid_from = formData.get("valid_from") as string;
  const valid_to = (formData.get("valid_to") as string) || null;
  const note = (formData.get("note") as string) || null;

  if (!warehouse_id || !price_per_ton_per_day || !valid_from) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  const { error } = await supabase.from("storage_rates").insert({
    warehouse_id,
    price_per_ton_per_day,
    valid_from,
    valid_to,
    note,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/depolama-ucretleri");
  return { success: true };
}

export async function deleteStorageRate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("storage_rates")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/depolama-ucretleri");
  return { success: true };
}
