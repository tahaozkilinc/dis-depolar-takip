import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTon } from "@/lib/format";
import type { Product, Profile, Warehouse, StockBalance } from "@/lib/types";
import StockEntryForm from "./StockEntryForm";
import DeleteEntryButton from "./DeleteEntryButton";

interface StockEntryRow {
  id: string;
  warehouse_id: string;
  product_id: string;
  tonnage: number;
  entry_date: string;
  note: string | null;
  created_by: string | null;
  warehouses: { name: string } | null;
  products: { name: string } | null;
}

export default async function StokGirisiPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session!.user;

  const [
    { data: profile },
    { data: warehouses },
    { data: products },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    supabase
      .from("warehouses")
      .select("*")
      .eq("active", true)
      .order("name"),
    supabase.from("products").select("*").order("name"),
  ]);

  const isAdmin = profile?.role === "admin";
  const isViewer = profile?.role === "viewer";
  const isOperasyon = profile?.role === "operasyon";
  const fixedWarehouseId =
    isAdmin || isViewer || isOperasyon ? null : profile?.warehouse_id ?? null;
  const fixedWarehouseName = fixedWarehouseId
    ? (warehouses ?? []).find((w) => w.id === fixedWarehouseId)?.name ?? null
    : null;

  let entriesQuery = supabase
    .from("stock_entries")
    .select(
      "id, warehouse_id, product_id, tonnage, entry_date, note, created_by, warehouses(name), products(name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  let balancesQuery = supabase
    .from("stock_balances")
    .select("*")
    .order("warehouse_name")
    .order("product_name");

  if (fixedWarehouseId) {
    entriesQuery = entriesQuery.eq("warehouse_id", fixedWarehouseId);
    balancesQuery = balancesQuery.eq("warehouse_id", fixedWarehouseId);
  }

  const [{ data: entries }, { data: balances }] = await Promise.all([
    entriesQuery,
    balancesQuery,
  ]);

  const stockEntries = (entries ?? []) as unknown as StockEntryRow[];

  const creatorIds = Array.from(
    new Set(stockEntries.map((e) => e.created_by).filter(Boolean))
  ) as string[];
  const { data: creatorNames } =
    creatorIds.length > 0
      ? await supabase
          .from("profile_names")
          .select("id, full_name")
          .in("id", creatorIds)
      : { data: [] };
  const nameById = new Map(
    (creatorNames ?? []).map((p) => [p.id as string, p.full_name as string])
  );
  const stockBalances = (balances ?? []) as StockBalance[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Stok Girişi</h1>

      {!isViewer && (
        <StockEntryForm
          warehouses={(warehouses ?? []) as Warehouse[]}
          products={(products ?? []) as Product[]}
          fixedWarehouseId={fixedWarehouseId}
          fixedWarehouseName={fixedWarehouseName}
        />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Son Stok Girişleri
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Depo</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2 text-right">Tonaj</th>
                <th className="px-4 py-2">Not</th>
                <th className="px-4 py-2">Giriş Yapan</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {stockEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {stockEntries.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2">{formatDate(e.entry_date)}</td>
                  <td className="px-4 py-2">{e.warehouses?.name ?? "-"}</td>
                  <td className="px-4 py-2">{e.products?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    {formatTon(e.tonnage)}
                  </td>
                  <td className="px-4 py-2">{e.note ?? "-"}</td>
                  <td className="px-4 py-2">
                    {e.created_by ? nameById.get(e.created_by) ?? "-" : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {(isAdmin || (!isViewer && e.created_by === user.id)) && (
                      <DeleteEntryButton id={e.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Güncel Stok Durumu
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Depo</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2 text-right">Toplam Giriş</th>
                <th className="px-4 py-2 text-right">Toplam Çıkış</th>
                <th className="px-4 py-2 text-right">Kalan Tonaj</th>
              </tr>
            </thead>
            <tbody>
              {stockBalances.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {stockBalances.map((b) => (
                <tr key={`${b.warehouse_id}-${b.product_id}`} className="border-t">
                  <td className="px-4 py-2">{b.warehouse_name}</td>
                  <td className="px-4 py-2">{b.product_name}</td>
                  <td className="px-4 py-2 text-right">
                    {formatTon(b.total_in)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatTon(b.total_out)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatTon(b.remaining_tonnage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
