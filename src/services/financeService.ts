'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requireManagerOrHR, logAction, createNotification } from './core';

export async function addExpense(data: FormData) {
  // [SECURITY] Always derive employeeId from the authenticated session.
  // Previously, employeeId was taken directly from FormData, allowing any
  // employee to submit expenses under another person's account (IDOR).
  const user = await getSessionUser();
  const employeeId = user.employeeId;

  try {
    const expense = await prisma.expense.create({
      data: {
        employeeId,
        date: data.get('date') as string,
        amount: Number(data.get('amount')),
        description: data.get('description') as string,
        status: 'Pending',
      }
    });
    await logAction('CREATE_EXPENSE', { expenseId: expense.expenseId, amount: expense.amount });
    
    // Notify managers
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
    for (const m of managers) {
      await createNotification(m.id, `New expense request for ₹${expense.amount} from ${emp?.name || "Unknown"}`, "/approvals");
    }

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
  await requireManagerOrHR();
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
  // [SECURITY] Always derive employeeId from the authenticated session.
  // Previously, employeeId was taken directly from FormData, allowing any
  // employee to submit PTO requests on behalf of anyone (IDOR).
  const user = await getSessionUser();
  const employeeId = user.employeeId;

  try {
    const pto = await prisma.pTO.create({
      data: {
        employeeId,
        startDate: data.get('startDate') as string,
        endDate: data.get('endDate') as string,
        status: 'Pending',
      }
    });
    await logAction('REQUEST_PTO', { ptoId: pto.ptoId });
    
    // Notify managers
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
    for (const m of managers) {
      await createNotification(
        m.id,
        `New PTO request from ${emp?.name || "Unknown"} for ${data.get('startDate')} to ${data.get('endDate')}`,
        "/approvals"
      );
    }

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updatePTOStatus(ptoId: string, status: string) {
  await requireManagerOrHR();
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

