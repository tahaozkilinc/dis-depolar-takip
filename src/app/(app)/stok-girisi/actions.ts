"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUpperTR } from "@/lib/text";

export async function addStockEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const warehouse_id = formData.get("warehouse_id") as string;
  const product_id = formData.get("product_id") as string;
  const owner_id = (formData.get("owner_id") as string) || null;
  const tonnage = parseFloat(formData.get("tonnage") as string);
  const entry_date = formData.get("entry_date") as string;
  const noteRaw = (formData.get("note") as string)?.trim();
  const note = noteRaw ? toUpperTR(noteRaw) : null;

  if (!warehouse_id || !product_id || !owner_id || !tonnage || tonnage <= 0) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  const { error } = await supabase.from("stock_entries").insert({
    warehouse_id,
    product_id,
    owner_id,
    tonnage,
    entry_date,
    note,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/stok-girisi");
  return { success: true };
}

export async function deleteStockEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("stock_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/stok-girisi");
  return { success: true };
}

export async function addOwnerQuick(name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Sahip adı boş olamaz." };
  const { error } = await supabase
    .from("product_owners")
    .insert({ name: toUpperTR(trimmed) });
  if (error) return { error: error.message };
  revalidatePath("/stok-girisi");
  return { success: true };
}

