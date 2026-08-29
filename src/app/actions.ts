'use server';

/**
 * Server Actions — mutations only.
 *
 * Data *reads* live in src/lib/db/*. This file only contains
 * server-side mutations (form actions, write operations).
 * All transport goes through the Sheets adapter in src/lib/sheets.ts.
 */

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sheetsPost } from '@/lib/sheets';

// Re-export reads so existing page imports keep working
export { getEmployees } from '@/lib/db/employees';
export { getLeads } from '@/lib/db/leads';
export { getExpenses, getPTO } from '@/lib/db/approvals';
export { getSystemSettings } from '@/lib/db/settings';
export { generateSalaryReport } from '@/lib/payroll';

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
    const newEmployee = [
      Date.now().toString(),
      data.get('name') as string,
      data.get('role') as string,
      data.get('email') as string,
      new Date().toISOString().split('T')[0],
      data.get('baseSalary') as string,
      data.get('commissionRate') as string,
      (data.get('target') as string) || '5',
      (data.get('probationDuration') as string) || '1',
      (data.get('managerId') as string) || '',
      data.get('password') as string,
    ];
    await sheetsPost('addEmployee', { data: newEmployee });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function offboardEmployee(employeeId: string) {
  await requireManager();
  try {
    await sheetsPost('offboardEmployee', { employeeId });
    revalidatePath('/team');
  } catch (e) {
    console.error(e);
  }
}

export async function clearAllEmployees(formData?: FormData) {
  await requireManager();
  try {
    await sheetsPost('clearAllEmployees');
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
    const newLead = [
      Date.now().toString(),
      data.get('employeeId') as string,
      new Date().toISOString().split('T')[0],
      data.get('status') as string,
      (data.get('notes') as string) || '',
      (data.get('followUp') as string) || '',
      (data.get('assignee') as string) || '',
    ];
    await sheetsPost('addLead', { data: newLead });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateLead(leadId: string, updates: Record<string, string>) {
  try {
    await sheetsPost('updateLead', { leadId, updates });
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
    await sheetsPost('bulkReassign', { leadIds, newEmployeeId, newAssigneeName });
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
    const newExpense = [
      Date.now().toString(),
      data.get('employeeId') as string,
      data.get('date') as string,
      data.get('amount') as string,
      data.get('description') as string,
      'Pending',
    ];
    await sheetsPost('addExpense', { data: newExpense });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
  await requireManager();
  try {
    await sheetsPost('updateExpenseStatus', { expenseId, status });
    revalidatePath('/approvals');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function addPTO(data: FormData) {
  try {
    const newPTO = [
      Date.now().toString(),
      data.get('employeeId') as string,
      data.get('startDate') as string,
      data.get('endDate') as string,
      'Pending',
    ];
    await sheetsPost('addPTO', { data: newPTO });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updatePTOStatus(ptoId: string, status: string) {
  await requireManager();
  try {
    await sheetsPost('updatePTOStatus', { ptoId, status });
    revalidatePath('/approvals');
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ---------------------------------------------------------------------------
// Settings mutations
// ---------------------------------------------------------------------------

export async function updateSystemSetting(key: string, value: string) {
  await requireManager();
  try {
    await sheetsPost('updateSetting', { key, value });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function triggerExportAudit() {
  await requireManager();
  try {
    await sheetsPost('exportAudit');
    return { success: true };
  } catch {
    return { success: false };
  }
}
