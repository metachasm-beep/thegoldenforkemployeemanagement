import { Employee } from '@/types';
import { prisma } from '../prisma';

export async function getEmployees(): Promise<Employee[]> {
  try {
    const rows = await prisma.employee.findMany();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role as Employee['role'],
      email: row.email,
      startDate: row.startDate || '',
      baseSalary: row.baseSalary,
      commissionRate: row.commissionRate,
      target: row.target,
      probationDuration: row.probationDuration,
      managerId: row.managerId || undefined,
      isProbation: row.isProbation,
      failedMonths: row.failedMonths,
      penalty: row.penalty,
      sessionVersion: row.sessionVersion,
    }));
  } catch {
    return [];
  }
}
