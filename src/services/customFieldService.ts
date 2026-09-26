'use server';

import { prisma } from '@/lib/prisma';
import { CustomFieldDefinition } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function getCustomFieldDefinitions(entityType: 'LEAD' | 'EMPLOYEE'): Promise<CustomFieldDefinition[]> {
  try {
    const fields = await prisma.customFieldDefinition.findMany({
      where: { entityType },
      orderBy: { createdAt: 'asc' }
    });
    return fields as CustomFieldDefinition[];
  } catch (error) {
    console.error(`Failed to fetch ${entityType} custom fields:`, error);
    return [];
  }
}

export async function createCustomFieldDefinition(data: Omit<CustomFieldDefinition, 'id'>) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user as any).role !== 'Manager' && (session.user as any).role !== 'HR')) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.customFieldDefinition.create({
      data: {
        entityType: data.entityType,
        name: data.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'), // Normalize key
        label: data.label,
        type: data.type,
        options: data.options,
        required: data.required
      }
    });

    revalidatePath('/settings');
    revalidatePath('/team');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create custom field:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCustomFieldDefinition(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user as any).role !== 'Manager' && (session.user as any).role !== 'HR')) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.customFieldDefinition.delete({
      where: { id }
    });

    revalidatePath('/settings');
    revalidatePath('/team');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete custom field:', error);
    return { success: false, error: error.message };
  }
}
