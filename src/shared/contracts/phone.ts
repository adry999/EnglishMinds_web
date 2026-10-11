const SEPARATORS = /[\s().-]/g;
const RO_PHONE = /^(?:\+40|0040|40)?0?([237]\d{8})$/;

export function normalizeRoPhone(input: string): string | null {
  const match = RO_PHONE.exec(input.replace(SEPARATORS, ''));
  return match ? `+40${match[1]}` : null;
}
