"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUpperTR } from "@/lib/text";
import type { CarrierContact } from "@/lib/types";

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

export async function updateCarrierContacts(
  id: string,
  contacts: CarrierContact[]
) {
  const supabase = await createClient();
  const cleaned = contacts
    .map((c) => ({
      name: toUpperTR(c.name.trim()),
      role: toUpperTR(c.role.trim()),
      phone: c.phone.trim(),
    }))
    .filter((c) => c.name || c.role || c.phone);

  const { error } = await supabase
    .from("carriers")
    .update({ contacts: cleaned })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/nakliyeciler/${id}`);
  return { success: true };
}

export async function uploadContract(id: string, formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return { error: "Dosya seçilmedi." };
  if (file.type !== "application/pdf") {
    return { error: "Yalnızca PDF dosyası yükleyebilirsiniz." };
  }

  const path = `${id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("carrier-contracts")
    .upload(path, file, { contentType: "application/pdf" });

  if (uploadError) return { error: uploadError.message };

  const { data: carrier } = await supabase
    .from("carriers")
    .select("contract_path")
    .eq("id", id)
    .maybeSingle<{ contract_path: string | null }>();

  if (carrier?.contract_path) {
    await supabase.storage.from("carrier-contracts").remove([carrier.contract_path]);
  }

  const { error } = await supabase
    .from("carriers")
    .update({ contract_path: path })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/nakliyeciler/${id}`);
  return { success: true };
}

export async function deleteContract(id: string) {
  const supabase = await createClient();

  const { data: carrier } = await supabase
    .from("carriers")
    .select("contract_path")
    .eq("id", id)
    .maybeSingle<{ contract_path: string | null }>();

  if (carrier?.contract_path) {
    await supabase.storage.from("carrier-contracts").remove([carrier.contract_path]);
  }

  const { error } = await supabase
    .from("carriers")
    .update({ contract_path: null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/nakliyeciler/${id}`);
  return { success: true };
}
