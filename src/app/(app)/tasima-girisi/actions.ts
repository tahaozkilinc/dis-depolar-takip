"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUpperTR } from "@/lib/text";
import { isValidPlate } from "@/lib/plate";

export async function addShipment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  const warehouse_id = formData.get("warehouse_id") as string;
  const product_id = formData.get("product_id") as string;
  const vehicle_plate = (formData.get("vehicle_plate") as string)?.trim();
  const tonnage = parseFloat(formData.get("tonnage") as string);
  const destination_id = (formData.get("destination_id") as string) || null;
  const carrier_id = (formData.get("carrier_id") as string) || null;

  const now = new Date();
  const todayIstanbul = now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });
  const nowTimeIstanbul = now.toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });

  let shipment_date = formData.get("shipment_date") as string;
  let shipment_time = (formData.get("shipment_time") as string)?.trim();

  if (profile?.role === "operasyon_takip") {
    // Operasyon takip kullanıcıları sadece bugünün tarih/saatiyle taşıma girebilir.
    shipment_date = todayIstanbul;
    shipment_time = nowTimeIstanbul;
  } else {
    shipment_time = shipment_time || nowTimeIstanbul;
  }
  const driverNameRaw = (formData.get("driver_name") as string)?.trim();
  const driver_name = driverNameRaw ? toUpperTR(driverNameRaw) : null;
  const notesRaw = (formData.get("notes") as string)?.trim();
  const notes = notesRaw ? toUpperTR(notesRaw) : null;

  if (!warehouse_id || !product_id || !vehicle_plate || !tonnage || tonnage <= 0) {
    return { error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  if (!isValidPlate(vehicle_plate)) {
    return { error: "Geçersiz plaka formatı. Örnek: 34-ABC-123" };
  }

  const { error } = await supabase.from("shipments").insert({
    warehouse_id,
    product_id,
    vehicle_plate,
    tonnage,
    destination_id,
    carrier_id,
    shipment_date,
    shipment_time,
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
