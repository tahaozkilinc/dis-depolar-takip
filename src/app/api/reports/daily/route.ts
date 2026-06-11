import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import type { Profile, StockBalance } from "@/lib/types";
import DailyReportDocument, {
  type DailyReportCarrierRow,
  type DailyReportWarehouseRow,
} from "@/lib/pdf/DailyReportDocument";

interface ShipmentRow {
  warehouse_id: string;
  product_id: string;
  tonnage: number;
  carrier_id: string | null;
  warehouses: { name: string } | null;
  products: { name: string } | null;
  carriers: { name: string } | null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle<Profile>();

  if (profile?.role !== "admin" && profile?.role !== "viewer") {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDate = yesterday.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });

  const [{ data: balances }, { data: shipments }] = await Promise.all([
    supabase.from("stock_balances").select("*"),
    supabase
      .from("shipments")
      .select(
        "warehouse_id, product_id, tonnage, carrier_id, warehouses(name), products(name), carriers(name)"
      )
      .eq("shipment_date", yesterdayDate),
  ]);

  const balanceRows = (balances ?? []) as StockBalance[];
  const shipmentRows = (shipments ?? []) as unknown as ShipmentRow[];

  const yesterdayByKey = new Map<string, number>();
  for (const s of shipmentRows) {
    const key = `${s.warehouse_id}-${s.product_id}`;
    yesterdayByKey.set(key, (yesterdayByKey.get(key) ?? 0) + Number(s.tonnage));
  }

  const warehouseRows: DailyReportWarehouseRow[] = balanceRows.map((b) => ({
    warehouse_name: b.warehouse_name,
    product_name: b.product_name,
    remaining_tonnage: Number(b.remaining_tonnage),
    yesterday_tonnage: yesterdayByKey.get(`${b.warehouse_id}-${b.product_id}`) ?? 0,
  }));

  const carrierMap = new Map<string, { shipment_count: number; total_tonnage: number }>();
  for (const s of shipmentRows) {
    const name = s.carriers?.name ?? "Belirtilmemiş";
    const existing = carrierMap.get(name) ?? { shipment_count: 0, total_tonnage: 0 };
    existing.shipment_count += 1;
    existing.total_tonnage += Number(s.tonnage);
    carrierMap.set(name, existing);
  }
  const carrierRows: DailyReportCarrierRow[] = Array.from(carrierMap.entries())
    .map(([carrier_name, v]) => ({ carrier_name, ...v }))
    .sort((a, b) => b.total_tonnage - a.total_tonnage);

  const totalRemaining = balanceRows.reduce((sum, b) => sum + Number(b.remaining_tonnage), 0);
  const totalYesterday = shipmentRows.reduce((sum, s) => sum + Number(s.tonnage), 0);

  const generatedAt = now.toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "short",
    timeStyle: "short",
  });

  const yesterdayLabel = yesterday.toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul",
  });

  const buffer = await renderToBuffer(
    DailyReportDocument({
      data: {
        generatedAt,
        yesterdayLabel: `${yesterdayLabel} (Dün)`,
        totalRemaining,
        totalYesterday,
        yesterdayShipmentCount: shipmentRows.length,
        warehouseRows,
        carrierRows,
      },
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gunluk-operasyon-raporu-${now
        .toISOString()
        .slice(0, 10)}.pdf"`,
    },
  });
}
