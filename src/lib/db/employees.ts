import { Employee } from '@/types';
import { sheetsGet } from '@/lib/sheets';

export async function getEmployees(): Promise<Employee[]> {
  try {
    const rows = await sheetsGet<unknown[]>('getEmployees');
    if (!rows || rows.length === 0) return [];
    return rows.map((row: any) => ({
      id: String(row[0]),
      name: String(row[1]),
      role: String(row[2]) as Employee['role'],
      email: String(row[3]),
      startDate: String(row[4]),
      baseSalary: parseFloat(row[5]) || 0,
      commissionRate: parseFloat(row[6]) || 0,
      target: parseInt(row[7]) || 5,
      probationDuration: parseInt(row[8]) || 1,
      managerId: row[9] ? String(row[9]) : undefined,
    }));
  } catch {
    return [];
  }
}
