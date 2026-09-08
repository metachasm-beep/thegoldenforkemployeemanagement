'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { revalidatePath } from 'next/cache';

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  return session.user as any;
}

export async function getConversations() {
  const user = await getSessionUser();
  const employeeId = user.employeeId;

  return await prisma.conversation.findMany({
    where: {
      participants: {
        some: { employeeId }
      }
    },
    include: {
      participants: {
        include: { employee: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getOrCreateDirectConversation(otherEmployeeId: string) {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;

  // Find existing
  const existingConvos = await prisma.conversation.findMany({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { employeeId: currentEmployeeId } } },
        { participants: { some: { employeeId: otherEmployeeId } } }
      ]
    },
    include: { participants: true }
  });

  const existing = existingConvos.find(c => c.participants.length === 2);
  
  if (existing) {
    return existing;
  }

  // Create new
  return await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [
          { employeeId: currentEmployeeId },
          { employeeId: otherEmployeeId }
        ]
      }
    },
    include: { participants: true }
  });
}

export async function getMessages(conversationId: string) {
  const user = await getSessionUser();
  
  // Verify access
  const hasAccess = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: user.employeeId
      }
    }
  });

  if (!hasAccess) throw new Error('Unauthorized');

  return await prisma.message.findMany({
    where: { conversationId },
    include: { sender: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function sendMessage(conversationId: string, content: string) {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;

  // Verify access
  const hasAccess = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: currentEmployeeId
      }
    }
  });

  if (!hasAccess) throw new Error('Unauthorized');

  const message = await prisma.message.create({
    data: {
      content,
      conversationId,
      senderId: currentEmployeeId
    },
    include: { sender: true }
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  // Trigger Pusher event
  await pusherServer.trigger(
    `private-conversation-${conversationId}`,
    'new-message',
    message
  );
  
  return message;
}
