import { prisma } from '../prisma';

export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch {
    return {};
  }
}
