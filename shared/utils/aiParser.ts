const MD_BOLD = /\*\*(.+?)\*\*/g;
const MD_ITALIC = /\*(.+?)\*/g;
const MD_UNDERLINE = /__(.+?)__/g;
const MD_HEADING = /###\s*/g;

function extractString(data: unknown): string | null {
  if (typeof data === 'string') return data;
  if (typeof data !== 'object' || data === null) return null;

  const values = Array.isArray(data) ? data : Object.values(data);
  for (const v of values) {
    const found = extractString(v);
    if (found) return found;
  }
  return null;
}

function cleanMd(text: string): string {
  return text
    .replace(MD_BOLD, '$1')
    .replace(MD_ITALIC, '$1')
    .replace(MD_UNDERLINE, '$1')
    .replace(MD_HEADING, '');
}

export function extractReply(raw: string, maxLength = 2000): string {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }

  const text = extractString(data);
  if (!text) return '...';

  const cleaned = cleanMd(text);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '...';
}
