import { sheetsGet } from '@/lib/sheets';

export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const rows = await sheetsGet<unknown[]>('getSettings');
    if (!rows || rows.length === 0) return {};
    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      if (row[0]) settings[String(row[0])] = String(row[1] ?? '');
    });
    return settings;
  } catch {
    return {};
  }
}
