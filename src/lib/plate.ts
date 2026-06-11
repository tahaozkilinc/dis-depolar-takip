// Turkish vehicle plate format: PP-LLL-NNNN
// PP = province code (01-81), LLL = 1-3 letters (no Q, W, X), NNNN = 2-4 digits
const PLATE_LETTERS = "ABCDEFGHIJKLMNOPRSTUVYZ";

const PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|8[01])-[A-PR-TVYZ]{1,3}-[0-9]{2,4}$/;

export function formatPlate(value: string): string {
  const cleaned = value
    .toLocaleUpperCase("tr-TR")
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");

  let digits1 = "";
  let letters = "";
  let digits2 = "";
  let rest = cleaned;

  while (rest.length && digits1.length < 2 && /[0-9]/.test(rest[0])) {
    digits1 += rest[0];
    rest = rest.slice(1);
  }
  while (rest.length && letters.length < 3 && PLATE_LETTERS.includes(rest[0])) {
    letters += rest[0];
    rest = rest.slice(1);
  }
  if (letters.length > 0) {
    while (rest.length && digits2.length < 4 && /[0-9]/.test(rest[0])) {
      digits2 += rest[0];
      rest = rest.slice(1);
    }
  }

  let result = digits1;
  if (letters) result += `-${letters}`;
  if (digits2) result += `-${digits2}`;
  return result;
}

export function isValidPlate(value: string): boolean {
  return PLATE_REGEX.test(value);
}
