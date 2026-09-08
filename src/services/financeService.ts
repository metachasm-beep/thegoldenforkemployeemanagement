'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { requireManagerOrHR, logAction, createNotification } from './core';
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
      const empId = data.get('employeeId') as string;
      const emp = await prisma.employee.findUnique({where: {id: empId}}); 
      await createNotification(m.id, `New expense request for ₹${expense.amount} from ${emp?.name || "Unknown"} (ID: ${empId.slice(0,8)})`, "/approvals");
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
      const empId = data.get("employeeId") as string; const emp = await prisma.employee.findUnique({where: {id: empId}}); await createNotification(m.id, `New PTO request from ${emp?.name || "Unknown"} (ID: ${empId.slice(0,8)}) for ${data.get('startDate')} to ${data.get('endDate')}`, "/approvals");
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

