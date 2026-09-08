'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getSessionUser, requireManagerOrHR, logAction, createNotification, requireManager } from './core';
export async function addEmployee(data: FormData) {
  const user = await requireManagerOrHR();
  const requestedRole = data.get('role') as string;
  
  if (user.role === 'HR' && (requestedRole === 'Manager' || requestedRole === 'HR')) {
    throw new Error('HR is not authorized to create Manager or HR roles.');
  }

  try {
    const emp = await prisma.employee.create({
      data: {
        name: data.get('name') as string,
        role: requestedRole,
        email: data.get('email') as string,
        startDate: new Date().toISOString().split('T')[0],
        baseSalary: Number(data.get('baseSalary')),
        probationSalary: Number(data.get('probationSalary')) || 15000,
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
  const user = await requireManagerOrHR();
  
  if (user.role === 'HR') {
    const existing = await prisma.offboardRequest.findFirst({
      where: { employeeId, status: 'Pending' }
    });
    if (!existing) {
      await prisma.offboardRequest.create({
        data: { employeeId, requestedBy: user.employeeId, status: 'Pending' }
      });
      await logAction('OFFBOARD_REQUEST_CREATED', { employeeId });
      revalidatePath('/team');
      revalidatePath('/approvals');
    }
    return;
  }

  try {
    let targetAssigneeId = user.employeeId;
    if (user.role === 'HR') {
      const firstManager = await prisma.employee.findFirst({ where: { role: 'Manager' } });
      if (firstManager) targetAssigneeId = firstManager.id;
    }
    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: targetAssigneeId, assignee: 'Manager' }
    });
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    await logAction('OFFBOARD_EMPLOYEE', { employeeId });
    revalidatePath('/team');
  } catch (e) {
    console.error(e);
  }
}

export async function approveOffboardRequest(requestId: string, employeeId: string) {
  const user = await requireManager();
  try {
    await prisma.offboardRequest.update({
      where: { id: requestId },
      data: { status: 'Approved' }
    });

    await prisma.lead.updateMany({
      where: { employeeId },
      data: { employeeId: user.employeeId, assignee: 'Manager' }
    });
    await prisma.employee.delete({
      where: { id: employeeId }
    });
    await logAction('OFFBOARD_EMPLOYEE', { employeeId, requestId });
    revalidatePath('/team');
    revalidatePath('/approvals');
  } catch(e) {
    console.error(e);
  }
}

export async function rejectOffboardRequest(requestId: string) {
  await requireManager();
  try {
    await prisma.offboardRequest.update({
      where: { id: requestId },
      data: { status: 'Rejected' }
    });
    await logAction('REJECT_OFFBOARD_REQUEST', { requestId });
    revalidatePath('/team');
    revalidatePath('/approvals');
  } catch(e) {
    console.error(e);
  }
}

export async function forceLogoutEmployee(employeeId: string, formData?: FormData) {
  await requireManagerOrHR();
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

export async function uploadAvatar(fd: FormData) {
  try {
    const employeeId = fd.get('employeeId') as string;
    const file = fd.get('file') as File;
    
    if (!file) {
      throw new Error("No file uploaded");
    }
    
    // Upload to Vercel Blob
    const blob = await put(`avatars/${employeeId}-${file.name}`, file, {
      access: 'public',
    });
    
    // Save URL to DB
    await prisma.employee.update({
      where: { id: employeeId },
      data: { avatarUrl: blob.url }
    });
    
    await logAction('AVATAR_UPLOAD', { message: 'Profile picture updated to blob' });
    revalidatePath('/', 'layout');
    return { success: true, url: blob.url };
  } catch (e: any) {
    console.error("Blob upload error:", e);
    return { success: false, error: e.message };
  }
}

export async function updateProfile(employeeId: string, data: Record<string, string>) {
  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber
      }
    });
    
    await logAction('UPDATE_PROFILE', { targetEmployeeId: employeeId, ...data });
    revalidatePath('/settings');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateEmployee(fd: FormData) {
  try {
    const employeeId = fd.get('employeeId') as string;
    const baseSalary = parseInt(fd.get('baseSalary') as string);
    const probationSalary = parseInt(fd.get('probationSalary') as string);
    const commissionRate = parseInt(fd.get('commissionRate') as string);
    const target = parseInt(fd.get('target') as string);
    const managerId = fd.get('managerId') as string || null;

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        baseSalary,
        probationSalary: isNaN(probationSalary) ? 15000 : probationSalary,
        commissionRate,
        target,
        managerId: managerId === '' ? null : managerId,
      }
    });

    await logAction('UPDATE_EMPLOYEE', { targetEmployeeId: employeeId, baseSalary, probationSalary, commissionRate, target, managerId });

    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

