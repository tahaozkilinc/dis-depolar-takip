"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUpperTR } from "@/lib/text";

export async function updateOwnFullName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const fullNameRaw = (formData.get("full_name") as string)?.trim();
  if (!fullNameRaw) return { error: "Ad soyad zorunludur." };

  const full_name = toUpperTR(fullNameRaw);

  const { error } = await supabase.rpc("update_own_full_name", {
    p_full_name: full_name,
  });

  if (error) return { error: error.message };
  revalidatePath("/hesabim");
  return { success: true };
}
