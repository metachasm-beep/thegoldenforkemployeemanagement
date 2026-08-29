import { Lead } from '@/types';
import { sheetsGet } from '@/lib/sheets';

export async function getLeads(): Promise<Lead[]> {
  try {
    const rows = await sheetsGet<unknown[]>('getLeads');
    if (!rows || rows.length === 0) return [];
    return rows.map((row: any) => ({
      leadId: String(row[0]),
      employeeId: String(row[1]),
      date: String(row[2]),
      status: String(row[3]),
      notes: row[4] ? String(row[4]) : undefined,
      followUp: row[5] ? String(row[5]) : undefined,
      assignee: row[6] ? String(row[6]) : undefined,
    }));
  } catch {
    return [];
  }
}
