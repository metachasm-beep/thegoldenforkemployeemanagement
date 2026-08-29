import { Expense, PTO } from '@/types';
import { sheetsGet } from '@/lib/sheets';

export async function getExpenses(): Promise<Expense[]> {
  try {
    const rows = await sheetsGet<unknown[]>('getExpenses');
    if (!rows || rows.length === 0) return [];
    return rows.map((r: any) => ({
      expenseId: String(r[0]),
      employeeId: String(r[1]),
      date: String(r[2]),
      amount: parseFloat(r[3]) || 0,
      description: String(r[4]),
      status: String(r[5]),
    }));
  } catch {
    return [];
  }
}

export async function getPTO(): Promise<PTO[]> {
  try {
    const rows = await sheetsGet<unknown[]>('getPTO');
    if (!rows || rows.length === 0) return [];
    return rows.map((r: any) => ({
      ptoId: String(r[0]),
      employeeId: String(r[1]),
      startDate: String(r[2]),
      endDate: String(r[3]),
      status: String(r[4]),
    }));
  } catch {
    return [];
  }
}
