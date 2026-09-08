'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getSessionUser, logAction, createNotification, requireManager } from './core';
export async function addLead(data: FormData) {
    try {
      const user = await getSessionUser();
      const role = user?.role || 'Employee';
      let status = data.get('status') as string;
      if (status === 'Converted' && role !== 'Manager' && role !== 'Team Lead') {
        status = 'Pending Verification';
      }

      const lead = await prisma.lead.create({
        data: {
          employeeId: data.get('employeeId') as string,
          date: new Date().toISOString().split('T')[0],
          status: status,
        notes: (data.get('notes') as string) || '',
        followUp: (data.get('followUp') as string) || '',
        assignee: (data.get('assignee') as string) || '',
      }
    });
    await logAction('CREATE_LEAD', { leadId: lead.leadId, leadDetails: lead });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateLead(leadId: string, updates: Record<string, string>) {
  try {
    const user = await getSessionUser();
    const role = user?.role || 'Employee';

    let status = updates.status || updates.stage;
    if (status === 'Converted' && role !== 'Manager' && role !== 'Team Lead') {
      status = 'Pending Verification';
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'Converted') {
        updateData.convertedAt = new Date();
      }
    }
    if (updates.assignee !== undefined) updateData.assignee = updates.assignee;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.followUp !== undefined) updateData.followUp = updates.followUp;

    const lead = await prisma.lead.update({
      where: { leadId },
      data: updateData
    });

    await logAction('UPDATE_LEAD', { leadId, updates, leadDetails: lead });
    
    // Notify manager if converted
    if (status === 'Converted') {
      const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
      for (const m of managers) {
        await createNotification(m.id, `Lead converted by ${user.email}`);
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkReassignLeads(
  leadIds: string[],
  newEmployeeId: string,
  newAssigneeName: string
) {
  await requireManager();
  try {
    await prisma.lead.updateMany({
      where: { leadId: { in: leadIds } },
      data: { employeeId: newEmployeeId, assignee: newAssigneeName }
    });
    await logAction('BULK_REASSIGN_LEADS', { count: leadIds.length, newEmployeeId });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateLeadStatusWithReason(leadId: string, newStage: string, reason?: string) {
  try {
    const user = await getSessionUser();
    if (user.role !== 'Manager' && user.role !== 'Team Lead') {
      throw new Error('Unauthorized');
    }

    const isConverted = newStage === 'Converted';
    const lead = await prisma.lead.update({
      where: { leadId },
      data: { 
        status: newStage,
        ...(isConverted && { convertedAt: new Date() })
      }
    });

    await logAction('UPDATE_LEAD_STATUS', { leadId, newStage, reason, leadDetails: lead });

    if (newStage === 'Converted') {
      await createNotification(lead.employeeId, `Your sale conversion for ${lead.assignee} was verified and approved!`);
    } else {
      await createNotification(lead.employeeId, `Your sale conversion for ${lead.assignee} was rejected. Reason: ${reason || 'Not provided'}`);
    }

    revalidatePath('/');
    revalidatePath('/approvals');
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function deleteLead(leadId: string) {
  try {
    const user = await getSessionUser();
    const lead = await prisma.lead.findUnique({ where: { leadId } });
    if (!lead) return { success: false, error: 'Not found' };
    
    if (user.role !== 'Manager' && lead.employeeId !== user.employeeId) {
      throw new Error('Unauthorized');
    }

    await prisma.lead.delete({
      where: { leadId }
    });

    await logAction('DELETE_LEAD', { leadId, leadDetails: lead });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

