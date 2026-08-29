import { Expense, PTO } from '@/types';
import { prisma } from '../prisma';

export async function getExpenses(): Promise<Expense[]> {
  try {
    const rows = await prisma.expense.findMany();
    return rows.map(r => ({
      expenseId: r.expenseId,
      employeeId: r.employeeId,
      date: r.date,
      amount: r.amount,
      description: r.description,
      status: r.status,
    }));
  } catch {
    return [];
  }
}

export async function getPTO(): Promise<PTO[]> {
  try {
    const rows = await prisma.pTO.findMany();
    return rows.map(r => ({
      ptoId: r.ptoId,
      employeeId: r.employeeId,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    }));
  } catch {
    return [];
  }
}
