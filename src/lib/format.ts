export function formatTL(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return (
    n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR", { timeZone: "UTC" });
}

export function formatTon(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/** Tam sayı ton gösterimi (ondalık olmadan, binlik ayraçlı). */
export function formatTonWhole(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return Math.round(n).toLocaleString("tr-TR");
}
