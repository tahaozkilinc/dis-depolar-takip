/** Uppercase a string using Turkish casing rules (i -> İ, ı -> I). */
export function toUpperTR(value: string): string {
  return value.toLocaleUpperCase("tr-TR");
}
