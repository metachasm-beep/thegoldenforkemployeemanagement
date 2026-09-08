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
  const isManager = user.role === 'Manager' || user.role === 'HR';
  const employeeId = (overrideEmployeeId && isManager) ? overrideEmployeeId : user.employeeId;

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
    include: { sender: true, parent: { include: { sender: true } }, reactions: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function sendMessage(conversationId: string, content: string, parentId?: string) {
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

  // 1. Sync Global RBAC Channels
  const channels = [
    { name: '#company-announcements', isReadOnly: true, roles: ['Manager', 'HR', 'Team Lead', 'Sales Executive'] },
    { name: '#hr-private', isReadOnly: false, roles: ['HR'] },
    { name: '#leadership-strategy', isReadOnly: false, roles: ['Manager', 'Team Lead'] }
  ];

  for (const ch of channels) {
    const hasRole = ch.roles.includes(emp.role);
    
    let convo = await prisma.conversation.findFirst({
      where: { name: ch.name, type: 'GROUP' }
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: { name: ch.name, type: 'GROUP', isReadOnly: ch.isReadOnly, restrictedTo: ch.roles }
      });
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
    });

    if (hasRole && !isParticipant) {
      await prisma.conversationParticipant.create({ data: { conversationId: convo.id, employeeId: emp.id } });
    } else if (!hasRole && isParticipant) {
      await prisma.conversationParticipant.delete({ where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } } });
    }
  }

  // 2. Sync Hierarchical Team Group
  const ensureTeamGroup = async (managerEmp: any) => {
    const teamName = `Team ${managerEmp.name}`;
    let convo = await prisma.conversation.findFirst({
      where: { name: teamName, type: 'GROUP' }
    });
    if (!convo) {
      convo = await prisma.conversation.create({
        data: { name: teamName, type: 'GROUP', isReadOnly: false }
      });
      await prisma.conversationParticipant.create({ data: { conversationId: convo.id, employeeId: managerEmp.id } });
    }
    
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
    });
    
    const shouldBeInTeam = emp.id === managerEmp.id || emp.managerId === managerEmp.id;
    
    if (shouldBeInTeam && !isParticipant) {
      await prisma.conversationParticipant.create({ data: { conversationId: convo.id, employeeId: emp.id } });
    } else if (!shouldBeInTeam && isParticipant) {
      await prisma.conversationParticipant.delete({ where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } } });
    }
  };

  if (emp.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: emp.managerId } });
    if (manager) await ensureTeamGroup(manager);
  }
  if (emp.role === 'Manager' || emp.role === 'Team Lead') {
    await ensureTeamGroup(emp);
  }
}

export async function setPresenceStatus(isAway: boolean) {
  const user = await getSessionUser();
  await pusherServer.trigger('presence-global', 'user-status-change', {
    userId: user.employeeId,
    status: isAway ? 'away' : 'online'
  });
}

export async function getSystemBot() {
  let bot = await prisma.employee.findFirst({ where: { role: 'System Bot' } });
  if (!bot) {
    bot = await prisma.employee.create({
      data: {
        name: 'Golden Fork Bot',
        email: 'bot@goldenfork.com',
        role: 'System Bot',
        baseSalary: 0,
        target: 0,
        avatarUrl: 'https://ui-avatars.com/api/?name=GF&background=F59E0B&color=fff',
        commissionRate: 0,
        probationDuration: 0,
        isProbation: false,
        failedMonths: 0,
        penalty: 0,
      }
    });
  }
  return bot;
}

export async function sendSystemNotification(employeeId: string, content: string) {
  try {
    const bot = await getSystemBot();
    let convo = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { employeeId: bot.id } } },
          { participants: { some: { employeeId: employeeId } } }
        ]
      }
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { employeeId: bot.id },
              { employeeId: employeeId }
            ]
          }
        }
      });
    }

    const message = await prisma.message.create({
      data: { content, conversationId: convo.id, senderId: bot.id },
      include: { sender: true }
    });

    await pusherServer.trigger(`private-conversation-${convo.id}`, 'new-message', message);
    return true;
  } catch (error) {
    console.error('Failed to send system notification:', error);
    return false;
  }
}

export async function markAsRead(conversationId: string) {
  const user = await getSessionUser();
  
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { lastReadAt: new Date() }
  });
  
  // Optionally broadcast read receipt
  await pusherServer.trigger(`private-conversation-${conversationId}`, 'read-receipt', {
    employeeId: user.employeeId,
    lastReadAt: new Date().toISOString()
  });
}

export async function toggleReaction(messageId: string, emoji: string) {
  const user = await getSessionUser();
  const existing = await prisma.reaction.findUnique({
    where: { messageId_employeeId_emoji: { messageId, employeeId: user.employeeId, emoji } }
  });
  
  let reaction;
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    reaction = await prisma.reaction.create({
      data: { messageId, employeeId: user.employeeId, emoji }
    });
  }

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (msg) {
    await pusherServer.trigger(`private-conversation-${msg.conversationId}`, 'reaction-update', {
      messageId,
      employeeId: user.employeeId,
      emoji,
      added: !existing
    });
  }
}

export async function searchMessages(query: string) {
  if (!query || query.length < 2) return [];
  const user = await getSessionUser();
  
  // Find messages where user is a participant of the conversation
  const messages = await prisma.message.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      conversation: {
        participants: { some: { employeeId: user.employeeId } }
      }
    },
    include: { sender: true, conversation: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  return messages;
}
