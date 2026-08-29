'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

async function requireManager() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'Manager') {
    throw new Error('Forbidden: Manager access required.');
  }
}

// ---------------------------------------------------------------------------
// Employee mutations
// ---------------------------------------------------------------------------

export async function addEmployee(data: FormData) {
  try {
    const hash = crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex');

    await prisma.employee.create({
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
        password: hash,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
      }
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function offboardEmployee(employeeId: string) {
  await requireManager();
  try {
    // 1. Reassign leads to manager
    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: 'MANAGER_ID', assignee: 'Manager' }
    });
    // 2. Delete employee
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    revalidatePath('/team');
  } catch (e) {
    console.error(e);
  }
}

export async function clearAllEmployees(formData?: FormData) {
  await requireManager();
  try {
    await prisma.employee.deleteMany({
      where: { role: { not: 'Manager' } } // don't delete manager!
    });
    revalidatePath('/team');
    revalidatePath('/');
  } catch (e) {
    console.error(e);
  }
}

// ---------------------------------------------------------------------------
// Lead mutations
// ---------------------------------------------------------------------------

export async function addLead(data: FormData) {
  try {
    await prisma.lead.create({
      data: {
        employeeId: data.get('employeeId') as string,
        date: new Date().toISOString().split('T')[0],
        status: data.get('status') as string,
        notes: (data.get('notes') as string) || '',
        followUp: (data.get('followUp') as string) || '',
        assignee: (data.get('assignee') as string) || '',
      }
    });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateLead(leadId: string, updates: Record<string, string>) {
  try {
    // We only update status in current implementation
    if (updates.stage) {
      await prisma.lead.update({
        where: { leadId },
        data: { status: updates.stage }
      });
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
    await prisma.expense.create({
      data: {
        employeeId: data.get('employeeId') as string,
        date: data.get('date') as string,
        amount: Number(data.get('amount')),
        description: data.get('description') as string,
        status: 'Pending',
      }
    });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
  await requireManager();
  try {
    await prisma.expense.update({
      where: { expenseId },
      data: { status }
    });
    revalidatePath('/approvals');
  } catch (e) {
    console.error(e);
  }
}

export async function addPTO(data: FormData) {
  try {
    await prisma.pTO.create({
      data: {
        employeeId: data.get('employeeId') as string,
        startDate: data.get('startDate') as string,
        endDate: data.get('endDate') as string,
        status: 'Pending',
      }
    });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updatePTOStatus(ptoId: string, status: string) {
  await requireManager();
  try {
    await prisma.pTO.update({
      where: { ptoId },
      data: { status }
    });
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
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function triggerExportAudit() {
  await requireManager();
  try {
    // Simulating the audit log email for now
    console.log("SECURITY ALERT: Data Exported");
    return { success: true };
  } catch {
    return { success: false };
  }
}
