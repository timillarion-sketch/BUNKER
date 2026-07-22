export const BNKR_REGEX = /^BNKR-[A-F0-9]{4}-[A-F0-9]{4}$/;

export function isValidBnkrId(id: string): boolean {
  return BNKR_REGEX.test(id);
}
