'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user as any;
}

export async function requireManager() {
  const user = await getSessionUser();
  if (!user || user.role !== 'Manager') {
    throw new Error('Forbidden: Manager access required.');
  }
  return user;
}

export async function requireManagerOrHR() {
  const user = await getSessionUser();
  if (!user || (user.role !== 'Manager' && user.role !== 'HR')) {
    throw new Error('Forbidden: Manager or HR access required.');
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

export async function createNotification(recipientId: string, message: string, link: string | null = null) {
  try {
    await prisma.notification.create({
      data: { recipientId, message, link }
    });
  } catch (e) {
    console.error("Notification failed:", e);
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

