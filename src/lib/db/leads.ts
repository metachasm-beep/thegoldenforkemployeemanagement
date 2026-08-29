import { Lead } from '@/types';
import { prisma } from '../prisma';

export async function getLeads(): Promise<Lead[]> {
  try {
    const rows = await prisma.lead.findMany();
    return rows.map(row => ({
      leadId: row.leadId,
      employeeId: row.employeeId,
      date: row.date,
      status: row.status,
      notes: row.notes || '',
      followUp: row.followUp || '',
      assignee: row.assignee || '',
      createdAt: row.createdAt,
      convertedAt: row.convertedAt || undefined,
    }));
  } catch {
    return [];
  }
}
