const BNKR_REGEX = /^BNKR-[A-F0-9]{4}-[A-F0-9]{4}$/;

export function formatBnkrId(uuid: string): string {
  return `BNKR-${uuid.slice(0, 4).toUpperCase()}-${uuid.slice(4, 8).toUpperCase()}`;
}

export function isValidBnkrId(id: string): boolean {
  return BNKR_REGEX.test(id);
}
