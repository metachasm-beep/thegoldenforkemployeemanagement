'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { extractCustomFields } from '@/lib/customFieldsUtils';
import { toIstDateKey } from '@/lib/hiringMetrics';
import { getSessionUser, requireManagerOrHR, logAction, createNotification, requireManager } from './core';

export async function addEmployee(data: FormData) {
  const user = await requireManagerOrHR();
  const requestedRole = data.get('role') as string;
  
  if (user.role === 'HR' && (requestedRole === 'Manager' || requestedRole === 'HR')) {
    throw new Error('HR is not authorized to create Manager or HR roles.');
  }
  
  if (requestedRole === 'Manager' && user.email !== 'metachasm@gmail.com') {
    throw new Error('Only the Head Manager can add other managers.');
  }

  try {
    const phone = ((data.get('phone') as string) || '').trim();
    const extractedCustom = extractCustomFields(data);
    if (phone) {
      extractedCustom.phone = phone;
    }

    const emp = await prisma.employee.create({
      data: {
        name: ((data.get('name') as string) || '').trim(),
        role: requestedRole,
        email: ((data.get('email') as string) || '').trim(),
        startDate: toIstDateKey(new Date()),
        baseSalary: Number(data.get('baseSalary')),
        probationSalary: Number(data.get('probationSalary')) || 15000,
        commissionRate: Number(data.get('commissionRate')),
        target: Number(data.get('target')) || 5,
        probationDuration: Number(data.get('probationDuration')) || 1,
        managerId: (data.get('managerId') as string) || null,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
        customFields: extractedCustom,
      }
    });
    await logAction('CREATE_EMPLOYEE', {
      employeeId: emp.id,
      name: emp.name,
      role: emp.role,
      hiredByName: user.name || user.email || 'Team',
      hiredByRole: user.role || 'Manager',
    });
    revalidatePath('/');
    revalidatePath('/team');
    return { success: true };
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002' || (e.message && e.message.includes('Unique constraint failed') && e.message.includes('email'))) {
      return { success: false, error: 'An employee with this email already exists in the system.' };
    }
    return { success: false, error: 'Database error occurred. Please check the input values.' };
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
    const targetEmployee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!targetEmployee) throw new Error('Employee not found');

    if (targetEmployee.role === 'Manager' && user.email !== 'metachasm@gmail.com') {
      throw new Error('Only the Head Manager can remove other managers.');
    }

    // Preserve original executive attribution on leads when offboarding instead of overwriting with Metachasm Admin
    const empLeads = await prisma.lead.findMany({
      where: { employeeId },
      select: { leadId: true, customFields: true },
    });
    for (const l of empLeads) {
      const cf = (l.customFields as Record<string, any>) || {};
      if (!cf.createdByName) {
        await prisma.lead.update({
          where: { leadId: l.leadId },
          data: {
            customFields: {
              ...cf,
              createdByName: targetEmployee.name.trim(),
            },
          },
        });
      }
    }

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
    const targetEmployee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!targetEmployee) throw new Error('Employee not found');

    if (targetEmployee.role === 'Manager' && user.email !== 'metachasm@gmail.com') {
      throw new Error('Only the Head Manager can approve the removal of other managers.');
    }

    await prisma.offboardRequest.update({
      where: { id: requestId },
      data: { status: 'Approved' }
    });

    // Preserve original executive attribution on leads when approving offboard request
    const empLeads = await prisma.lead.findMany({
      where: { employeeId },
      select: { leadId: true, customFields: true },
    });
    for (const l of empLeads) {
      const cf = (l.customFields as Record<string, any>) || {};
      if (!cf.createdByName) {
        await prisma.lead.update({
          where: { leadId: l.leadId },
          data: {
            customFields: {
              ...cf,
              createdByName: targetEmployee.name.trim(),
            },
          },
        });
      }
    }

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
  // [SECURITY] Verify the caller can only upload an avatar for themselves
  // unless they are a Manager or HR.
  const user = await getSessionUser();
  const employeeId = fd.get('employeeId') as string;
  if (user.employeeId !== employeeId && user.role !== 'Manager' && user.role !== 'HR') {
    throw new Error('Forbidden: You can only update your own avatar.');
  }

  try {
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

export async function updateProfile(employeeId: string, data: Record<string, any>) {
  // [SECURITY] Verify the caller is either updating their own profile or is a Manager/HR.
  const user = await getSessionUser();
  if (user.employeeId !== employeeId && user.role !== 'Manager' && user.role !== 'HR') {
    throw new Error('Forbidden: You can only update your own profile.');
  }

  try {
    const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
    const hasCustomUpdate = data.customFields !== undefined || data.phone !== undefined;
    const mergedCustomFields = hasCustomUpdate
      ? {
          ...((existing?.customFields as Record<string, any>) || {}),
          ...(data.customFields || {}),
          ...(data.phone !== undefined && { phone: String(data.phone).trim() }),
        }
      : undefined;

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(data.panNumber !== undefined && { panNumber: data.panNumber }),
        ...(data.aadhaarNumber !== undefined && { aadhaarNumber: data.aadhaarNumber }),
        ...(mergedCustomFields !== undefined && { customFields: mergedCustomFields })
      }
    });
    
    await logAction('UPDATE_PROFILE', { targetEmployeeId: employeeId });
    revalidatePath('/settings');
    revalidatePath('/team');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateEmployee(fd: FormData) {
  // [SECURITY] Require Manager, COO, or HR to update employee details.
  await requireManagerOrHR();
  try {
    const employeeId = fd.get('employeeId') as string;
    const requestedRole = fd.get('role') as string | null;
    const baseSalary = parseInt(fd.get('baseSalary') as string);
    const probationSalary = parseInt(fd.get('probationSalary') as string);
    const probationDurationRaw = fd.get('probationDuration');
    const probationDuration = probationDurationRaw ? parseInt(probationDurationRaw as string) : NaN;
    const commissionRate = parseInt(fd.get('commissionRate') as string);
    const target = parseInt(fd.get('target') as string);
    const managerId = fd.get('managerId') as string || null;
    const phone = fd.get('phone');

    const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
    const mergedCustomFields: Record<string, any> = {
      ...((existing?.customFields as Record<string, any>) || {}),
      ...extractCustomFields(fd),
    };
    if (phone !== null && phone !== undefined) {
      mergedCustomFields.phone = String(phone).trim();
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(requestedRole ? { role: requestedRole } : {}),
        baseSalary,
        probationSalary: isNaN(probationSalary) ? 15000 : probationSalary,
        ...(!isNaN(probationDuration) && probationDuration > 0 ? { probationDuration } : {}),
        commissionRate,
        target,
        managerId: managerId === '' ? null : managerId,
        customFields: mergedCustomFields,
      }
    });

    await logAction('UPDATE_EMPLOYEE', { targetEmployeeId: employeeId, baseSalary, probationSalary, commissionRate, target, managerId });

    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
