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

export async function getConversations(overrideEmployeeId?: string) {
  const user = await getSessionUser();
  const isManager = user.role === 'Manager' || user.role === 'HR';
  const employeeId = (overrideEmployeeId && isManager) ? overrideEmployeeId : user.employeeId;

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
  const [me, them] = await Promise.all([
    prisma.employee.findUnique({ where: { id: currentEmployeeId } }),
    prisma.employee.findUnique({ where: { id: otherEmployeeId } })
  ]);
  
  if (!me || !them) throw new Error('Employee not found');
  
  if (me.role === 'Sales Executive' && them.role === 'Sales Executive') {
    throw new Error('Sales Executives cannot direct message each other.');
  }


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

export async function getMessages(conversationId: string, overrideEmployeeId?: string) {
  const user = await getSessionUser();
  
  // Verify access
  const hasAccess = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: (overrideEmployeeId && (user.role === 'Manager' || user.role === 'HR')) ? overrideEmployeeId : user.employeeId
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
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  
  if (convo?.isReadOnly && emp?.role !== 'Manager' && emp?.role !== 'HR') {
    throw new Error('This channel is read-only.');
  }


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

export async function syncGlobalChannels() {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  if (!emp) return;

  const channels = [
    { name: '#company-announcements', isReadOnly: true, roles: ['Manager', 'HR', 'Team Lead', 'Sales Executive'] },
    { name: '#hr-private', isReadOnly: false, roles: ['HR'] },
    { name: '#leadership-strategy', isReadOnly: false, roles: ['Manager', 'Team Lead'] }
  ];

  for (const ch of channels) {
    const hasRole = ch.roles.includes(emp.role);
    
    // Find or create channel
    let convo = await prisma.conversation.findFirst({
      where: { name: ch.name, type: 'GROUP' }
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          name: ch.name,
          type: 'GROUP',
          isReadOnly: ch.isReadOnly,
          restrictedTo: ch.roles
        }
      });
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
    });

    if (hasRole && !isParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: convo.id, employeeId: emp.id }
      });
    } else if (!hasRole && isParticipant) {
      await prisma.conversationParticipant.delete({
        where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
      });
    }
  }
}

export async function setPresenceStatus(isAway: boolean) {
  const user = await getSessionUser();
  await pusherServer.trigger('presence-global', 'user-status-change', {
    userId: user.employeeId,
    status: isAway ? 'away' : 'online'
  });
}
