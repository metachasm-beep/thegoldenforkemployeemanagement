'use server';

import webpush from "@/lib/webpush";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { GLOBAL_CHANNELS_POLICY, getTeamChannelName } from '@/lib/policies/channelPolicy';
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
  
  if (me.role === 'Sales Executive' && them.role !== 'HR' && them.role !== 'System Bot') {
    throw new Error('Sales Executives can only message HR.');
  }

  if (me.role === 'Manager' && them.role !== 'HR' && them.role !== 'System Bot') {
    throw new Error('Managers can only message HR.');
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

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_employeeId: { conversationId, employeeId } }
  });
  
  return await prisma.message.findMany({
    where: { conversationId, createdAt: { gt: participant?.clearedAt || new Date(0) } },
    include: { sender: true, parent: { include: { sender: true } }, reactions: true, starredBy: { where: { employeeId } } },
    orderBy: { createdAt: 'asc' }
  });
}

export async function sendMessage(conversationId: string, content: string, parentId?: string, attachmentUrl?: string, attachmentType?: string) {
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

  // Basic link metadata parsing (Feature 12)
  let linkMetadata: any = undefined;
  const urlMatch = content.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    try {
      // Very basic metadata for now, can be expanded to fetch real og:tags
      linkMetadata = { url: urlMatch[0], title: new URL(urlMatch[0]).hostname };
    } catch (e) {}
  }

  await prisma.employee.update({ where: { id: currentEmployeeId }, data: { lastSeenAt: new Date() } });

  const message = await prisma.message.create({
    data: {
      content,
      conversationId,
      senderId: currentEmployeeId,
      parentId,
      attachmentUrl,
      attachmentType,
      linkMetadata
    },
    include: { sender: true, parent: { include: { sender: true } } }
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  // Trigger Pusher event to the active conversation channel
  await pusherServer.trigger(
    `private-conversation-${conversationId}`,
    'new-message',
    message
  );

  // Trigger global notification to all participants (except sender)
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { employeeId: true }
    });

    for (const p of participants) {
      
      if (p.employeeId !== currentEmployeeId) {
        await pusherServer.trigger(
          `private-user-${p.employeeId}`,
          'global-new-message',
          {
            messageId: message.id,
            conversationId: message.conversationId,
            content: message.content,
            senderName: (message as any).sender.name,
            conversationName: convo?.name
          }
        ).catch(e => console.error('Pusher global notification error:', e));

        // Send Web Push for offline support
        const subs = await prisma.pushSubscription.findMany({
          where: { employeeId: p.employeeId }
        });
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: `New message from ${(message as any).sender.name}`,
                body: message.content,
                url: `/chat?id=${message.conversationId}`
              })
            );
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }

    }
  } catch (error) {
    console.error('Failed to send global notifications:', error);
  }
  
  return message;
}

export async function syncGlobalChannels() {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  if (!emp) return;

  // 1. Sync Global RBAC Channels
  for (const ch of GLOBAL_CHANNELS_POLICY) {
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
    const teamName = getTeamChannelName(managerEmp.name);
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

export async function markAsDelivered(conversationId: string) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { lastDeliveredAt: new Date() }
  });
  
  await pusherServer.trigger(`private-conversation-${conversationId}`, "delivery-receipt", {
    employeeId: user.employeeId,
    lastDeliveredAt: new Date().toISOString()
  });
}

export async function editMessage(messageId: string, newContent: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  
  if (!msg || msg.senderId !== user.employeeId) throw new Error("Unauthorized");
  
  const history = msg.editHistory ? (Array.isArray(msg.editHistory) ? msg.editHistory : []) : [];
  history.push({ content: msg.content, editedAt: new Date().toISOString() });
  
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, isEdited: true, editHistory: history },
    include: { sender: true }
  });
  
  await pusherServer.trigger(`private-conversation-${msg.conversationId}`, "message-updated", updated);
  return updated;
}

export async function deleteMessage(messageId: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  
  if (!msg || msg.senderId !== user.employeeId) throw new Error("Unauthorized");
  
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: "🚫 This message was deleted" },
    include: { sender: true }
  });
  
  await pusherServer.trigger(`private-conversation-${msg.conversationId}`, "message-updated", updated);
  return updated;
}

export async function togglePinConversation(conversationId: string, isPinned: boolean) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { isPinned }
  });
}

export async function toggleArchiveConversation(conversationId: string, isArchived: boolean) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { isArchived }
  });
}

export async function toggleStarMessage(messageId: string) {
  const user = await getSessionUser();
  const existing = await prisma.starredMessage.findUnique({
    where: { employeeId_messageId: { employeeId: user.employeeId, messageId } }
  });
  
  if (existing) {
    await prisma.starredMessage.delete({ where: { id: existing.id } });
    return false;
  } else {
    await prisma.starredMessage.create({
      data: { employeeId: user.employeeId, messageId }
    });
    return true;
  }
}

export async function getStarredMessages() {
  const user = await getSessionUser();
  return prisma.starredMessage.findMany({
    where: { employeeId: user.employeeId },
    include: { message: { include: { sender: true, conversation: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function clearChatHistory(conversationId: string) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { clearedAt: new Date() }
  });
}
