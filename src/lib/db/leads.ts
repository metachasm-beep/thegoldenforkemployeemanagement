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
      notes: row.notes || undefined,
      followUp: row.followUp || undefined,
      assignee: row.assignee || undefined,
    }));
  } catch {
    return [];
  }
}
