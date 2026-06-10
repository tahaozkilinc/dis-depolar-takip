"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addStockEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const warehouse_id = formData.get("warehouse_id") as string;
  const product_id = formData.get("product_id") as string;
  const tonnage = parseFloat(formData.get("tonnage") as string);
  const entry_date = formData.get("entry_date") as string;
  const note = (formData.get("note") as string) || null;

  if (!warehouse_id || !product_id || !tonnage || tonnage <= 0) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  const { error } = await supabase.from("stock_entries").insert({
    warehouse_id,
    product_id,
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

export async function addProductQuick(name: string) {
  const supabase = await createClient();
  if (!name.trim()) return { error: "Ürün adı boş olamaz." };
  const { error } = await supabase
    .from("products")
    .insert({ name: name.trim() });
  if (error) return { error: error.message };
  revalidatePath("/stok-girisi");
  return { success: true };
}
