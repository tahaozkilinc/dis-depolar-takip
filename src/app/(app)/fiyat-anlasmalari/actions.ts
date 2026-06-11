"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUpperTR } from "@/lib/text";

export async function addPricingAgreement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const warehouse_id = formData.get("warehouse_id") as string;
  const destination_id = (formData.get("destination_id") as string) || null;
  const basis = formData.get("basis") as string;
  const unit_price = parseFloat(formData.get("unit_price") as string);
  const valid_from = formData.get("valid_from") as string;
  const valid_to = (formData.get("valid_to") as string) || null;
  const noteRaw = (formData.get("note") as string)?.trim();
  const note = noteRaw ? toUpperTR(noteRaw) : null;

  if (!warehouse_id || !basis || !unit_price || !valid_from) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  const { error } = await supabase.from("pricing_agreements").insert({
    warehouse_id,
    destination_id,
    basis,
    unit_price,
    valid_from,
    valid_to,
    note,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/fiyat-anlasmalari");
  return { success: true };
}

export async function deletePricingAgreement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_agreements")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fiyat-anlasmalari");
  return { success: true };
}
