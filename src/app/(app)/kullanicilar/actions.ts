"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function updateProfile(
  id: string,
  data: { role: UserRole; warehouse_id: string | null; active: boolean }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  // Guard: don't let admin demote/deactivate themselves
  if (user.id === id) {
    if (data.role !== "admin") {
      return { error: "Kendi rolünüzü değiştiremezsiniz." };
    }
    if (!data.active) {
      return { error: "Kendi hesabınızı pasif yapamazsınız." };
    }
  }

  const payload: {
    role: UserRole;
    warehouse_id: string | null;
    active: boolean;
  } = {
    role: data.role,
    warehouse_id:
      data.role === "depo" || data.role === "operasyon_takip"
        ? data.warehouse_id
        : null,
    active: data.active,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/kullanicilar");
  return { success: true };
}
