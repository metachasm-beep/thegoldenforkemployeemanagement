'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user as any;
}

async function requireManager() {
  const user = await getSessionUser();
  if (!user || user.role !== 'Manager') {
    throw new Error('Forbidden: Manager access required.');
  }
  return user;
}

export async function logAction(action: string, details: any) {
  try {
    const user = await getSessionUser();
    if (!user?.employeeId) return;
    
    await prisma.auditLog.create({
      data: {
        employeeId: user.employeeId,
        action,
        details: JSON.stringify(details),
      }
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

export async function createNotification(recipientId: string, message: string) {
  try {
    await prisma.notification.create({
      data: { recipientId, message }
    });
  } catch (e) {
    console.error("Notification failed:", e);
  }
}

// ---------------------------------------------------------------------------
// Employee mutations
// ---------------------------------------------------------------------------

export async function addEmployee(data: FormData) {
  try {
    const emp = await prisma.employee.create({
      data: {
        name: data.get('name') as string,
        role: data.get('role') as string,
        email: data.get('email') as string,
        startDate: new Date().toISOString().split('T')[0],
        baseSalary: Number(data.get('baseSalary')),
        commissionRate: Number(data.get('commissionRate')),
        target: Number(data.get('target')) || 5,
        probationDuration: Number(data.get('probationDuration')) || 1,
        managerId: (data.get('managerId') as string) || null,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
      }
    });
    await logAction('CREATE_EMPLOYEE', { employeeId: emp.id, name: emp.name });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function offboardEmployee(employeeId: string, formData?: FormData) {
  const user = await requireManager();
  try {
    // 1. Reassign leads to manager
    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: user.employeeId, assignee: 'Manager' }
    });
    // 2. Delete employee
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    await logAction('OFFBOARD_EMPLOYEE', { employeeId });
    revalidatePath('/team');
  } catch (e) {
    console.error(e);
  }
}

export async function forceLogoutEmployee(employeeId: string, formData?: FormData) {
  await requireManager();
  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { sessionVersion: { increment: 1 } }
    });
    await logAction('FORCE_LOGOUT', { targetEmployeeId: employeeId });
    revalidatePath('/team');
  } catch (e) {
    console.error(e);
  }
}

// ---------------------------------------------------------------------------
// Lead mutations
// ---------------------------------------------------------------------------

export async function addLead(data: FormData) {
  try {
    const lead = await prisma.lead.create({
      data: {
        employeeId: data.get('employeeId') as string,
        date: new Date().toISOString().split('T')[0],
        status: data.get('status') as string,
        notes: (data.get('notes') as string) || '',
        followUp: (data.get('followUp') as string) || '',
        assignee: (data.get('assignee') as string) || '',
      }
    });
    await logAction('CREATE_LEAD', { leadId: lead.leadId });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateLead(leadId: string, updates: Record<string, string>) {
  try {
    if (updates.stage) {
      const isConverted = updates.stage === 'Converted';
      const lead = await prisma.lead.update({
        where: { leadId },
        data: { 
          status: updates.stage,
          ...(isConverted && { convertedAt: new Date() })
        }
      });
      await logAction('UPDATE_LEAD_STAGE', { leadId, newStage: updates.stage });
      
      // Notify manager if converted
      if (isConverted) {
        const user = await getSessionUser();
        // Assuming we notify all managers, or just hardcode one for now
        const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
        for (const m of managers) {
          await createNotification(m.id, `Lead converted by ${user.email}!`);
        }
      }
    }
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
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

// ---------------------------------------------------------------------------
// Expense & PTO mutations
// ---------------------------------------------------------------------------

export async function addExpense(data: FormData) {
  try {
    const expense = await prisma.expense.create({
      data: {
        employeeId: data.get('employeeId') as string,
        date: data.get('date') as string,
        amount: Number(data.get('amount')),
        description: data.get('description') as string,
        status: 'Pending',
      }
    });
    await logAction('CREATE_EXPENSE', { expenseId: expense.expenseId, amount: expense.amount });
    
    // Notify managers
    const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
    for (const m of managers) {
      await createNotification(m.id, `New expense request for ₹${expense.amount}`);
    }

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
  await requireManager();
  try {
    const exp = await prisma.expense.update({
      where: { expenseId },
      data: { status }
    });
    await logAction('UPDATE_EXPENSE_STATUS', { expenseId, status });
    await createNotification(exp.employeeId, `Your expense for ₹${exp.amount} was ${status}`);
    revalidatePath('/approvals');
  } catch (e) {
    console.error(e);
  }
}

export async function addPTO(data: FormData) {
  try {
    const pto = await prisma.pTO.create({
      data: {
        employeeId: data.get('employeeId') as string,
        startDate: data.get('startDate') as string,
        endDate: data.get('endDate') as string,
        status: 'Pending',
      }
    });
    await logAction('REQUEST_PTO', { ptoId: pto.ptoId });
    
    // Notify managers
    const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
    for (const m of managers) {
      await createNotification(m.id, `New PTO request from ${data.get('startDate')} to ${data.get('endDate')}`);
    }

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updatePTOStatus(ptoId: string, status: string) {
  await requireManager();
  try {
    const pto = await prisma.pTO.update({
      where: { ptoId },
      data: { status }
    });
    await logAction('UPDATE_PTO_STATUS', { ptoId, status });
    await createNotification(pto.employeeId, `Your PTO request was ${status}`);
    revalidatePath('/approvals');
  } catch (e) {
    console.error(e);
  }
}

// ---------------------------------------------------------------------------
// Settings mutations
// ---------------------------------------------------------------------------

export async function updateSystemSetting(key: string, value: string) {
  await requireManager();
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    await logAction('UPDATE_SETTING', { key, value });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function triggerExportAudit() {
  await requireManager();
  try {
    await logAction('EXPORT_AUDIT_LOGS', {});
    console.log("SECURITY ALERT: Data Exported");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markNotificationRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getMyNotifications() {
  try {
    const user = await getSessionUser();
    if (!user?.employeeId) return [];
    
    return await prisma.notification.findMany({
      where: { recipientId: user.employeeId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  } catch {
    return [];
  }
}

