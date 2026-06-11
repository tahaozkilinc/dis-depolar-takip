"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function updateProfile(
  id: string,
  data: { role: UserRole; warehouse_ids: string[]; active: boolean }
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

  const { error } = await supabase
    .from("profiles")
    .update({ role: data.role, active: data.active })
    .eq("id", id);

  if (error) return { error: error.message };

  const { error: delError } = await supabase
    .from("profile_warehouses")
    .delete()
    .eq("profile_id", id);

  if (delError) return { error: delError.message };

  const warehouseIds =
    data.role === "depo" || data.role === "operasyon_takip"
      ? data.warehouse_ids
      : [];

  if (warehouseIds.length > 0) {
    const { error: insError } = await supabase
      .from("profile_warehouses")
      .insert(warehouseIds.map((warehouse_id) => ({ profile_id: id, warehouse_id })));
    if (insError) return { error: insError.message };
  }

  revalidatePath("/kullanicilar");
  return { success: true };
}
