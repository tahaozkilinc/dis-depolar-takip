"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addShipment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const warehouse_id = formData.get("warehouse_id") as string;
  const product_id = formData.get("product_id") as string;
  const vehicle_plate = (formData.get("vehicle_plate") as string)
    .trim()
    .toUpperCase();
  const tonnage = parseFloat(formData.get("tonnage") as string);
  const destination_id = (formData.get("destination_id") as string) || null;
  const shipment_date = formData.get("shipment_date") as string;
  const driver_name = (formData.get("driver_name") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!warehouse_id || !product_id || !vehicle_plate || !tonnage || tonnage <= 0) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  const { error } = await supabase.from("shipments").insert({
    warehouse_id,
    product_id,
    vehicle_plate,
    tonnage,
    destination_id,
    shipment_date,
    driver_name,
    notes,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/tasima-girisi");
  revalidatePath("/tasimalar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteShipment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasima-girisi");
  revalidatePath("/tasimalar");
  revalidatePath("/dashboard");
  return { success: true };
}
