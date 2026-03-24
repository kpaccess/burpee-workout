export function toDateKey(dateValue: string): string {
  const trimmed = (dateValue || '').trim();
  if (!trimmed) return '';
  if (trimmed.length >= 10) {
    return trimmed.slice(0, 10);
  }
  return trimmed;
}

