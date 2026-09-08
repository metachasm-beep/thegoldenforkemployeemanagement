'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { requireManager, logAction } from './core';
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

