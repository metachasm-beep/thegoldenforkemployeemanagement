'use server';

import webpush from '@/lib/webpush';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { GLOBAL_CHANNELS_POLICY, getTeamChannelName } from '@/lib/policies/channelPolicy';
import { createNotification } from '@/services/core';

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  return session.user as any;
}

export async function getConversations(overrideEmployeeId?: string) {
  const user = await getSessionUser();
  const isManager = user.role === 'Manager' || user.role === 'HR';
  const employeeId = overrideEmployeeId && isManager ? overrideEmployeeId : user.employeeId;
  const canViewCooGovernance = user.role === 'Manager' || user.role === 'COO';

  const convos = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { employeeId },
      },
    },
    include: {
      participants: {
        include: { employee: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return canViewCooGovernance
    ? convos
    : convos.filter((c) => c.name !== '#coo-governance');
}

export async function getOrCreateDirectConversation(otherEmployeeId: string) {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;
  const [me, them] = await Promise.all([
    prisma.employee.findUnique({ where: { id: currentEmployeeId } }),
    prisma.employee.findUnique({ where: { id: otherEmployeeId } }),
  ]);

  if (!me || !them) throw new Error('Employee not found');

  if (
    me.role === 'Sales Executive' &&
    them.role !== 'HR' &&
    them.role !== 'COO' &&
    them.role !== 'Team Lead' &&
    them.role !== 'System Bot'
  ) {
    throw new Error('Sales Executives can only message HR, Team Leads, or COO.');
  }

  // Find existing
  const existingConvos = await prisma.conversation.findMany({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { employeeId: currentEmployeeId } } },
        { participants: { some: { employeeId: otherEmployeeId } } },
      ],
    },
    include: {
      participants: { include: { employee: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const existing = existingConvos.find((c) => c.participants.length === 2);

  if (existing) {
    return existing;
  }

  // Create new
  return await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [{ employeeId: currentEmployeeId }, { employeeId: otherEmployeeId }],
      },
    },
    include: {
      participants: { include: { employee: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
}

export async function getMessages(conversationId: string, overrideEmployeeId?: string) {
  const user = await getSessionUser();
  const isManager = user.role === 'Manager' || user.role === 'HR';
  const employeeId = overrideEmployeeId && isManager ? overrideEmployeeId : user.employeeId;

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { name: true },
  });
  if (convo?.name === '#coo-governance' && user.role !== 'Manager' && user.role !== 'COO') {
    throw new Error('Unauthorized');
  }

  const hasAccess = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_employeeId: {
        conversationId,
        employeeId:
          overrideEmployeeId && (user.role === 'Manager' || user.role === 'HR')
            ? overrideEmployeeId
            : user.employeeId,
      },
    },
  });

  if (!hasAccess) throw new Error('Unauthorized');

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_employeeId: { conversationId, employeeId } },
  });

  return await prisma.message.findMany({
    where: { conversationId, createdAt: { gt: participant?.clearedAt || new Date(0) } },
    include: {
      sender: true,
      parent: { include: { sender: true } },
      replies: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
      reactions: true,
      starredBy: { where: { employeeId } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function handleSlashCommandIfAny(
  conversationId: string,
  rawContent: string,
  userRole: string
) {
  const trimmed = rawContent.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const argQuery = parts.slice(1).join(' ').trim();
  const bot = await getSystemBot();

  let botReply: string | null = null;

  if (cmd === '/help') {
    botReply = [
      '🤖 **Golden Fork Operational Bot — Slash Commands**',
      '- `/coo-status` — Live snapshot of COO Weekly/Monthly Hours, Active Session & Vesting Tier *(Founder & COO)*',
      '- `/trials` — Interactive 21-Day Free Trial venues with 1-click stage & conversion buttons',
      '- `/pipeline` — Live CRM lead pipeline & conversion summary',
      '- `/lead <search>` — Search & share interactive CRM Lead cards with inline Demo Verification',
      '- `/actions` — Interactive Block Kit Action Center for Pending Expenses, Unverified Demos & Active Trials',
      '- `/help` — Show available workspace commands',
    ].join('\n');
  } else if (cmd === '/coo-status' || cmd === '/status') {
    if (userRole !== 'Manager' && userRole !== 'COO') {
      botReply = '🔒 `/coo-status` is restricted to Founder and Contractual COO.';
    } else {
      const now = new Date();
      const monthStr = now.toISOString().slice(0, 7);
      const [sessions, ledgers, deployments] = await Promise.all([
        prisma.cooWorkSession
          .findMany({ orderBy: { startedAt: 'desc' }, take: 100 })
          .catch(() => []),
        prisma.cooMonthlyLedger.findMany().catch(() => []),
        prisma.merchantDeployment.findMany().catch(() => []),
      ]);
      const activeSession = sessions.find((s) => s.status === 'ACTIVE');
      const monthMins = sessions
        .filter(
          (s) =>
            s.verifiedByFounder !== false &&
            new Date(s.startedAt).toISOString().startsWith(monthStr)
        )
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const monthHrs = (monthMins / 60).toFixed(1);
      const completedMonths = ledgers.filter((l) => l.qualifiesAsCompletedMonth).length;
      const liveVenues = deployments.filter((d) => d.onboardingStatus === 'LIVE_ACTIVE').length;
      const activeTrials = deployments.filter((d) => d.onboardingStatus === 'TRIAL_21_DAY').length;

      botReply = [
        `📊 **COO Operational Snapshot (${monthStr})**`,
        `- **Timer Status:** ${
          activeSession
            ? `🟢 Active (${activeSession.pillar} — *${activeSession.taskTitle}*)`
            : '⚪ Standby'
        }`,
        `- **Monthly Verified Hours:** **${monthHrs}h** / 60h qualification (80h target)`,
        `- **Completed Vesting Months:** **${completedMonths} / 18**`,
        `- **Hospitality Footprint:** **${liveVenues}** Live Venues • **${activeTrials}** Active 21-Day Trials`,
      ].join('\n');
    }
  } else if (cmd === '/trials') {
    const trials = await prisma.merchantDeployment
      .findMany({
        where: { onboardingStatus: { in: ['TRIAL_21_DAY', 'MODULE_SETUP'] } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      })
      .catch(() => []);
    if (trials.length === 0) {
      botReply = '🏨 **21-Day Free Trial Pipeline:** No active 21-day trials currently in progress.';
    } else {
      const lines = trials.map(
        (t) =>
          `- **${t.venueName}** (${t.venueType}) — Stage: \`${t.onboardingStatus}\` • ACV: **₹${Number(
            t.annualContractValue || 0
          ).toLocaleString('en-IN')}/yr** • Trial Ends: \`${t.trialEndsAt || 'TBD'}\`\n[ACTION:TRIAL:${t.id}]`
      );
      botReply = [`🏨 **Active 21-Day Free Trial Venues (${trials.length})**`, ...lines].join('\n');
    }
  } else if (cmd === '/pipeline') {
    const leads = await prisma.lead.findMany().catch(() => []);
    const converted = leads.filter((l) => l.status === 'Converted').length;
    const pending = leads.filter((l) => l.status === 'Pending Verification').length;
    const demoVerified = leads.filter((l) => (l.customFields as any)?.cooDemoVerified === true).length;
    botReply = [
      '🎯 **Live CRM Pipeline Summary**',
      `- **Total Logged Leads:** **${leads.length}**`,
      `- **Converted Annual Deals:** **${converted}**`,
      `- **Pending Verification:** **${pending}**`,
      `- **Field Demos Verified by COO:** **${demoVerified}**`,
    ].join('\n');
  } else if (cmd === '/lead' || cmd === '/leads') {
    const leads = await prisma.lead
      .findMany({
        where: argQuery
          ? {
              OR: [
                { name: { contains: argQuery, mode: 'insensitive' } },
                { email: { contains: argQuery, mode: 'insensitive' } },
                { notes: { contains: argQuery, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: { createdAt: 'desc' },
        take: 4,
      })
      .catch(() => []);

    if (leads.length === 0) {
      botReply = `🔍 No CRM leads found matching \`${argQuery || 'recent'}\`.`;
    } else {
      const blocks = leads.map(
        (l) =>
          `🎯 **${l.name}** — Status: \`${l.status}\`${l.phone ? ` • 📞 \`${l.phone}\`` : ''}\n[LEAD:${l.leadId}]\n[ACTION:DEMO:${l.leadId}]`
      );
      botReply = [
        `📋 **CRM Lead Cards (${leads.length}${argQuery ? ` matching "${argQuery}"` : ' Latest'})**`,
        ...blocks,
      ].join('\n\n');
    }
  } else if (cmd === '/actions') {
    const [pendingExpenses, unverifiedLeads, activeTrials] = await Promise.all([
      prisma.expense.findMany({ where: { status: 'Pending' }, take: 3 }).catch(() => []),
      prisma.lead
        .findMany({
          where: { status: { notIn: ['Lost'] } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        })
        .catch(() => []),
      prisma.merchantDeployment
        .findMany({
          where: { onboardingStatus: { in: ['TRIAL_21_DAY', 'MODULE_SETUP'] } },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        })
        .catch(() => []),
    ]);

    const sections: string[] = ['⚡ **Interactive Operational Action Center**'];

    if (pendingExpenses.length > 0) {
      sections.push('**💳 Pending Expense Approvals:**');
      for (const exp of pendingExpenses) {
        sections.push(
          `🧾 **₹${exp.amount.toLocaleString('en-IN')}** — *${exp.description}* (${exp.date})${
            exp.amount > 10000 ? ' 🚨 *[Founder CapEx > ₹10k]*' : ''
          }\n[ACTION:EXPENSE:${exp.expenseId}]`
        );
      }
    }

    if (unverifiedLeads.length > 0) {
      sections.push('**🎯 Recent Leads & Field Demo Audits:**');
      for (const l of unverifiedLeads) {
        sections.push(
          `🏢 **${l.name}** — Stage: \`${l.status}\`\n[LEAD:${l.leadId}]\n[ACTION:DEMO:${l.leadId}]`
        );
      }
    }

    if (activeTrials.length > 0) {
      sections.push('**🏨 Active 21-Day Free Trial Deployments:**');
      for (const t of activeTrials) {
        sections.push(
          `🚀 **${t.venueName}** (${t.venueType}) — Stage: \`${t.onboardingStatus}\` • ACV: **₹${Number(
            t.annualContractValue || 0
          ).toLocaleString('en-IN')}/yr**\n[ACTION:TRIAL:${t.id}]`
        );
      }
    }

    if (sections.length === 1) {
      sections.push('✅ All pending expenses, demos, and trial actions are currently up to date.');
    }

    botReply = sections.join('\n\n');
  }

  if (!botReply) return null;

  const botMsg = await prisma.message.create({
    data: {
      content: botReply,
      conversationId,
      senderId: bot.id,
    },
    include: {
      sender: true,
      parent: { include: { sender: true } },
      replies: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  await pusherServer.trigger(`private-conversation-${conversationId}`, 'new-message', botMsg);
  return botMsg;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  parentId?: string,
  attachmentUrl?: string,
  attachmentType?: string
) {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });

  if (convo?.isReadOnly && emp?.role !== 'Manager' && emp?.role !== 'COO' && emp?.role !== 'HR') {
    throw new Error('This channel is read-only.');
  }

  // Verify access
  const hasAccess = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: currentEmployeeId,
      },
    },
  });

  if (!hasAccess) throw new Error('Unauthorized');

  // Basic link metadata parsing
  let linkMetadata: any = undefined;
  const urlMatch = content.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    try {
      linkMetadata = { url: urlMatch[0], title: new URL(urlMatch[0]).hostname };
    } catch {}
  }

  await prisma.employee.update({
    where: { id: currentEmployeeId },
    data: { lastSeenAt: new Date() },
  });

  const message = await prisma.message.create({
    data: {
      content,
      conversationId,
      senderId: currentEmployeeId,
      parentId,
      attachmentUrl,
      attachmentType,
      linkMetadata,
    },
    include: { sender: true, parent: { include: { sender: true } } },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Trigger Pusher event to the active conversation channel
  await pusherServer.trigger(`private-conversation-${conversationId}`, 'new-message', message);

  // Trigger slash command bot reply if applicable
  if (content.trim().startsWith('/')) {
    await handleSlashCommandIfAny(conversationId, content, emp?.role || 'Employee').catch((e) =>
      console.error('Slash command error:', e)
    );
  }

  // Trigger global notification to all participants (except sender)
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { employeeId: true },
    });

    for (const p of participants) {
      if (p.employeeId !== currentEmployeeId) {
        await pusherServer
          .trigger(`private-user-${p.employeeId}`, 'global-new-message', {
            messageId: message.id,
            conversationId: message.conversationId,
            content: message.content,
            senderName: (message as any).sender.name,
            conversationName: convo?.name,
          })
          .catch((e) => console.error('Pusher global notification error:', e));

        // Create in-app notification
        await createNotification(
          p.employeeId,
          `New message from ${(message as any).sender.name}: ${message.content.substring(0, 50)}${
            message.content.length > 50 ? '...' : ''
          }`,
          `/chat?id=${message.conversationId}`
        ).catch((e) => console.error('Failed to create in-app notification:', e));

        // Send Web Push for offline support
        const subs = await prisma.pushSubscription.findMany({
          where: { employeeId: p.employeeId },
        });
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: `New message from ${(message as any).sender.name}`,
                body: message.content,
                url: `/chat?id=${message.conversationId}`,
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

  const bot = await getSystemBot();

  // 1. Sync Global RBAC Channels
  for (const ch of GLOBAL_CHANNELS_POLICY) {
    const hasRole = ch.roles.includes(emp.role);

    let convo = await prisma.conversation.findFirst({
      where: { name: ch.name, type: 'GROUP' },
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: { name: ch.name, type: 'GROUP', isReadOnly: ch.isReadOnly, restrictedTo: ch.roles },
      });
    } else if (
      JSON.stringify(convo.restrictedTo) !== JSON.stringify(ch.roles) ||
      convo.isReadOnly !== ch.isReadOnly
    ) {
      convo = await prisma.conversation.update({
        where: { id: convo.id },
        data: { restrictedTo: ch.roles, isReadOnly: ch.isReadOnly },
      });
    }

    // Ensure System Bot is a participant of every operational channel
    const botParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: bot.id } },
    });
    if (!botParticipant) {
      await prisma.conversationParticipant
        .create({
          data: { conversationId: convo.id, employeeId: bot.id },
        })
        .catch(() => {});
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } },
    });

    if (hasRole && !isParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: convo.id, employeeId: emp.id },
      });
    } else if (!hasRole && isParticipant) {
      await prisma.conversationParticipant.delete({
        where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } },
      });
    }
  }

  // 2. Sync Hierarchical Team Group
  const ensureTeamGroup = async (managerEmp: any) => {
    const teamName = getTeamChannelName(managerEmp.name);
    let convo = await prisma.conversation.findFirst({
      where: { name: teamName, type: 'GROUP' },
    });
    if (!convo) {
      convo = await prisma.conversation.create({
        data: { name: teamName, type: 'GROUP', isReadOnly: false },
      });
      await prisma.conversationParticipant.create({
        data: { conversationId: convo.id, employeeId: managerEmp.id },
      });
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } },
    });

    const shouldBeInTeam =
      emp.id === managerEmp.id || emp.managerId === managerEmp.id || emp.role === 'COO';

    if (shouldBeInTeam && !isParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: convo.id, employeeId: emp.id },
      });
    } else if (!shouldBeInTeam && isParticipant) {
      await prisma.conversationParticipant.delete({
        where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } },
      });
    }
  };

  if (emp.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: emp.managerId } });
    if (manager) await ensureTeamGroup(manager);
  }
  if (emp.role === 'Manager' || emp.role === 'Team Lead') {
    await ensureTeamGroup(emp);
  }
  if (emp.role === 'COO') {
    const teamManagers = await prisma.employee.findMany({
      where: { role: { in: ['Manager', 'Team Lead'] } },
    });
    for (const tm of teamManagers) {
      await ensureTeamGroup(tm);
    }
  }
}

export async function setPresenceStatus(isAway: boolean) {
  const user = await getSessionUser();
  await pusherServer.trigger('presence-global', 'user-status-change', {
    userId: user.employeeId,
    status: isAway ? 'away' : 'online',
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
      },
    });
  }
  return bot;
}

export async function postBotChannelFeed(channelName: string, content: string) {
  try {
    const policy = GLOBAL_CHANNELS_POLICY.find((c) => c.name === channelName);
    const allowedRoles = policy?.roles || ['Manager', 'COO'];
    const isReadOnly = policy?.isReadOnly ?? false;

    const bot = await getSystemBot();
    let convo = await prisma.conversation.findFirst({
      where: { name: channelName, type: 'GROUP' },
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          name: channelName,
          type: 'GROUP',
          isReadOnly,
          restrictedTo: allowedRoles,
        },
      });
    }

    const eligibleEmployees = await prisma.employee.findMany({
      where: { role: { in: [...allowedRoles, 'System Bot'] } },
      select: { id: true },
    });

    const existingParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: convo.id },
      select: { employeeId: true },
    });
    const existingSet = new Set(existingParticipants.map((p) => p.employeeId));

    for (const emp of eligibleEmployees) {
      if (!existingSet.has(emp.id)) {
        await prisma.conversationParticipant
          .create({
            data: { conversationId: convo.id, employeeId: emp.id },
          })
          .catch(() => {});
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        conversationId: convo.id,
        senderId: bot.id,
      },
      include: { sender: true },
    });

    await prisma.conversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    });

    await pusherServer
      .trigger(`private-conversation-${convo.id}`, 'new-message', message)
      .catch(() => {});

    for (const emp of eligibleEmployees) {
      if (emp.id !== bot.id) {
        await pusherServer
          .trigger(`private-user-${emp.id}`, 'global-new-message', {
            messageId: message.id,
            conversationId: convo.id,
            content: message.content,
            senderName: `${bot.name} (${channelName})`,
            conversationName: channelName,
          })
          .catch(() => {});
      }
    }

    return true;
  } catch (err) {
    console.error(`Failed to post bot feed to ${channelName}:`, err);
    return false;
  }
}

export async function sendSystemNotification(employeeId: string, content: string) {
  try {
    const bot = await getSystemBot();
    let convo = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { employeeId: bot.id } } },
          { participants: { some: { employeeId: employeeId } } },
        ],
      },
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [{ employeeId: bot.id }, { employeeId: employeeId }],
          },
        },
      });
    }

    const message = await prisma.message.create({
      data: { content, conversationId: convo.id, senderId: bot.id },
      include: { sender: true },
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
    data: { lastReadAt: new Date() },
  });

  await pusherServer.trigger(`private-conversation-${conversationId}`, 'read-receipt', {
    employeeId: user.employeeId,
    lastReadAt: new Date().toISOString(),
  });
}

export async function toggleReaction(messageId: string, emoji: string) {
  const user = await getSessionUser();
  const existing = await prisma.reaction.findUnique({
    where: { messageId_employeeId_emoji: { messageId, employeeId: user.employeeId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { messageId, employeeId: user.employeeId, emoji },
    });
  }

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (msg) {
    await pusherServer.trigger(`private-conversation-${msg.conversationId}`, 'reaction-update', {
      messageId,
      employeeId: user.employeeId,
      emoji,
      added: !existing,
    });
  }
}

export async function searchMessages(query: string) {
  if (!query || query.length < 2) return [];
  const user = await getSessionUser();

  const messages = await prisma.message.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      conversation: {
        participants: { some: { employeeId: user.employeeId } },
      },
    },
    include: { sender: true, conversation: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return messages;
}

export async function markAsDelivered(conversationId: string) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { lastDeliveredAt: new Date() },
  });

  await pusherServer.trigger(`private-conversation-${conversationId}`, 'delivery-receipt', {
    employeeId: user.employeeId,
    lastDeliveredAt: new Date().toISOString(),
  });
}

export async function editMessage(messageId: string, newContent: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });

  if (!msg || msg.senderId !== user.employeeId) throw new Error('Unauthorized');

  const history = msg.editHistory ? (Array.isArray(msg.editHistory) ? msg.editHistory : []) : [];
  history.push({ content: msg.content, editedAt: new Date().toISOString() });

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, isEdited: true, editHistory: history },
    include: { sender: true },
  });

  await pusherServer.trigger(`private-conversation-${msg.conversationId}`, 'message-updated', updated);
  return updated;
}

export async function deleteMessage(messageId: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });

  if (!msg || msg.senderId !== user.employeeId) throw new Error('Unauthorized');

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: '🚫 This message was deleted' },
    include: { sender: true },
  });

  await pusherServer.trigger(`private-conversation-${msg.conversationId}`, 'message-updated', updated);
  return updated;
}

export async function togglePinConversation(conversationId: string, isPinned: boolean) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { isPinned },
  });
}

export async function toggleArchiveConversation(conversationId: string, isArchived: boolean) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { isArchived },
  });
}

export async function toggleStarMessage(messageId: string) {
  const user = await getSessionUser();
  const existing = await prisma.starredMessage.findUnique({
    where: { employeeId_messageId: { employeeId: user.employeeId, messageId } },
  });

  if (existing) {
    await prisma.starredMessage.delete({ where: { id: existing.id } });
    return false;
  } else {
    await prisma.starredMessage.create({
      data: { employeeId: user.employeeId, messageId },
    });
    return true;
  }
}

export async function getStarredMessages() {
  const user = await getSessionUser();
  return prisma.starredMessage.findMany({
    where: { employeeId: user.employeeId },
    include: { message: { include: { sender: true, conversation: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function clearChatHistory(conversationId: string) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { clearedAt: new Date() },
  });
}

// ==========================================
// 1. MENTIONS & REACTIONS INBOX
// ==========================================
export async function getMentionsAndReactions() {
  const user = await getSessionUser();
  const me = await prisma.employee.findUnique({ where: { id: user.employeeId } });
  if (!me) return { mentions: [], reactions: [] };

  const firstName = me.name.split(' ')[0];

  const [mentions, reactions] = await Promise.all([
    prisma.message.findMany({
      where: {
        isDeleted: false,
        senderId: { not: me.id },
        conversation: {
          participants: { some: { employeeId: me.id } },
        },
        OR: [
          { content: { contains: `@${me.name}`, mode: 'insensitive' } },
          { content: { contains: `@${firstName}`, mode: 'insensitive' } },
          { content: { contains: `@${me.role}`, mode: 'insensitive' } },
          { content: { contains: '@channel', mode: 'insensitive' } },
          { content: { contains: '@here', mode: 'insensitive' } },
          { parent: { senderId: me.id } },
        ],
      },
      include: {
        sender: true,
        conversation: true,
        parent: { include: { sender: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.reaction.findMany({
      where: {
        employeeId: { not: me.id },
        message: { senderId: me.id, isDeleted: false },
      },
      include: {
        employee: true,
        message: { include: { conversation: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  return { mentions, reactions };
}

// ==========================================
// 2. INTERACTIVE BLOCK KIT BOT ACTIONS
// ==========================================
export async function executeChatBotAction(
  messageId: string,
  actionType:
    | 'APPROVE_EXPENSE'
    | 'REJECT_EXPENSE'
    | 'VERIFY_DEMO'
    | 'FLAG_DEMO'
    | 'CONVERT_LEAD'
    | 'ADVANCE_TRIAL_STAGE'
    | 'CONVERT_TRIAL_LIVE',
  targetId: string
) {
  const user = await getSessionUser();
  const me = await prisma.employee.findUnique({ where: { id: user.employeeId } });
  if (!me) throw new Error('Employee not found');

  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    include: { sender: true },
  });
  if (!msg) throw new Error('Message not found');

  let outcomeNote = '';

  if (actionType === 'APPROVE_EXPENSE' || actionType === 'REJECT_EXPENSE') {
    if (me.role !== 'Manager' && me.role !== 'COO' && me.role !== 'HR') {
      throw new Error('Only Founder, COO, or HR can review expenses.');
    }
    const exp = await prisma.expense.findUnique({ where: { expenseId: targetId } });
    if (!exp) throw new Error('Expense record not found');

    if (actionType === 'APPROVE_EXPENSE' && me.role === 'COO' && exp.amount > 10000) {
      throw new Error(
        'Fiduciary Cap: Expenses above ₹10,000 require Sole Proprietor (Founder) approval.'
      );
    }

    const newStatus = actionType === 'APPROVE_EXPENSE' ? 'Approved' : 'Rejected';
    await prisma.expense.update({
      where: { expenseId: targetId },
      data: { status: newStatus },
    });
    outcomeNote = `${newStatus === 'Approved' ? '✅' : '❌'} Expense ₹${exp.amount.toLocaleString(
      'en-IN'
    )} (${exp.description}) **${newStatus}** by **${me.name}** (${me.role})`;
  } else if (
    actionType === 'VERIFY_DEMO' ||
    actionType === 'FLAG_DEMO' ||
    actionType === 'CONVERT_LEAD'
  ) {
    if (me.role !== 'Manager' && me.role !== 'COO' && me.role !== 'Team Lead') {
      throw new Error('Only Founder, COO, or Team Lead can execute lead/demo actions.');
    }
    const lead = await prisma.lead.findUnique({ where: { leadId: targetId } });
    if (!lead) throw new Error('Lead record not found');
    const cf = (lead.customFields as Record<string, any>) || {};

    if (actionType === 'VERIFY_DEMO') {
      await prisma.lead.update({
        where: { leadId: targetId },
        data: {
          customFields: {
            ...cf,
            cooDemoVerified: true,
            cooDemoVerifiedAt: new Date().toISOString(),
            cooDemoVerifiedBy: me.email,
          },
        },
      });
      outcomeNote = `✅ Field Demo for **${lead.name}** **Verified** by **${me.name}** (${me.role})`;
    } else if (actionType === 'FLAG_DEMO') {
      await prisma.lead.update({
        where: { leadId: targetId },
        data: {
          customFields: {
            ...cf,
            cooDemoVerified: false,
            cooDemoFlaggedAt: new Date().toISOString(),
            cooDemoFlaggedBy: me.email,
          },
        },
      });
      outcomeNote = `🚩 Field Demo for **${lead.name}** **Flagged for Re-Demo** by **${me.name}** (${me.role})`;
    } else if (actionType === 'CONVERT_LEAD') {
      await prisma.lead.update({
        where: { leadId: targetId },
        data: {
          status: 'Converted',
          convertedAt: new Date(),
        },
      });
      outcomeNote = `🏆 Lead **${lead.name}** marked **Converted** by **${me.name}** (${me.role})`;
    }
  } else if (actionType === 'ADVANCE_TRIAL_STAGE' || actionType === 'CONVERT_TRIAL_LIVE') {
    if (me.role !== 'Manager' && me.role !== 'COO') {
      throw new Error('Only Founder or COO can update 21-Day Trial venue stages.');
    }
    const dep = await prisma.merchantDeployment.findUnique({ where: { id: targetId } });
    if (!dep) throw new Error('Merchant deployment not found');

    const nextStage =
      actionType === 'CONVERT_TRIAL_LIVE'
        ? 'LIVE_ACTIVE'
        : dep.onboardingStatus === 'TRIAL_21_DAY'
        ? 'MODULE_SETUP'
        : 'LIVE_ACTIVE';

    await prisma.merchantDeployment.update({
      where: { id: targetId },
      data: {
        onboardingStatus: nextStage,
        lastHealthAuditDate: new Date().toISOString().slice(0, 10),
      },
    });
    outcomeNote = `🚀 Venue **${dep.venueName}** moved to **\`${nextStage}\`** by **${me.name}** (${me.role})`;
  }

  const prevMeta = (msg.linkMetadata as Record<string, any>) || {};
  const executedMap = prevMeta.executedActions || {};
  executedMap[`${actionType}:${targetId}`] = {
    by: me.name,
    role: me.role,
    at: new Date().toISOString(),
    outcomeNote,
  };

  const updatedContent = `${msg.content}\n\n> ${outcomeNote}`;
  const updatedMsg = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: updatedContent,
      linkMetadata: { ...prevMeta, executedActions: executedMap },
    },
    include: {
      sender: true,
      parent: { include: { sender: true } },
      replies: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  await pusherServer.trigger(
    `private-conversation-${msg.conversationId}`,
    'message-updated',
    updatedMsg
  );

  return { success: true, outcomeNote, message: updatedMsg };
}

// ==========================================
// 3. CRM ENTITY PICKER & LIVE PREVIEW
// ==========================================
export async function searchCrmEntitiesForChat(query: string) {
  await getSessionUser();
  const q = query.trim();

  const [leads, trials] = await Promise.all([
    prisma.lead
      .findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: { createdAt: 'desc' },
        take: 8,
      })
      .catch(() => []),
    prisma.merchantDeployment
      .findMany({
        where: q
          ? {
              OR: [
                { venueName: { contains: q, mode: 'insensitive' } },
                { venueType: { contains: q, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: { updatedAt: 'desc' },
        take: 8,
      })
      .catch(() => []),
  ]);

  return { leads, trials };
}

export async function getCrmEntityPreview(leadId: string) {
  await getSessionUser();
  const lead = await prisma.lead.findUnique({ where: { leadId } });
  if (!lead) return null;
  const owner = await prisma.employee.findUnique({
    where: { id: lead.employeeId },
    select: { name: true, role: true, email: true },
  });
  return { lead, owner };
}

// ==========================================
// 4. CUSTOM OPERATIONAL STATUS & PINNED MSGS
// ==========================================
export async function updateEmployeeChatStatus(emoji: string, text: string) {
  const user = await getSessionUser();
  const emp = await prisma.employee.findUnique({ where: { id: user.employeeId } });
  if (!emp) throw new Error('Employee not found');

  const cf = (emp.customFields as Record<string, any>) || {};
  const chatStatus =
    !emoji && !text
      ? null
      : {
          emoji,
          text,
          updatedAt: new Date().toISOString(),
        };

  await prisma.employee.update({
    where: { id: user.employeeId },
    data: {
      customFields: {
        ...cf,
        chatStatus,
      },
    },
  });

  return { success: true, chatStatus };
}

export async function togglePinMessage(messageId: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error('Message not found');

  const prevMeta = (msg.linkMetadata as Record<string, any>) || {};
  const nextPinned = !prevMeta.isPinned;

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      linkMetadata: {
        ...prevMeta,
        isPinned: nextPinned,
        pinnedBy: user.email,
        pinnedAt: new Date().toISOString(),
      },
    },
    include: {
      sender: true,
      parent: { include: { sender: true } },
      replies: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  await pusherServer.trigger(
    `private-conversation-${msg.conversationId}`,
    'message-updated',
    updated
  );

  return { isPinned: nextPinned, message: updated };
}

