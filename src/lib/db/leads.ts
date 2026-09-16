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
      name: row.name || '',
      email: row.email,
      phone: row.phone,
      linkedIn: row.linkedIn,
      objections: row.objections,
      nextAction: row.nextAction,
      notes: row.notes || '',
      followUp: row.followUp || '',
      createdAt: row.createdAt,
      convertedAt: row.convertedAt || undefined,
    }));
  } catch {
    return [];
  }
}
