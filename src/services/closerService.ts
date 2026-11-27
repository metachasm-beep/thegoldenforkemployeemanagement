'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  createNotification,
  getSessionUser,
  logAction,
  requireManagerOrCOO,
} from './core';
import { postBotChannelFeed } from '@/app/chatActions';
import {
  CLOSER_CONSTANTS,
  computeCloserBatchMetrics,
  evaluateCloserEodSubmission,
  getDispositionMeta,
} from '@/lib/closerEngine';
import { toIstDateKey } from '@/lib/hiringMetrics';
import { CloserLeadAssignmentRecord, Lead } from '@/types';

/**
 * COO or Manager/Founder dispatches up to 10 fresh leads for a given IST date to a Closer.
 * Preserves Lead.employeeId (original lead generator) and sets Lead.closerId = closerId.
 */
export async function dispatchCloserLeads(params: {
  closerId: string;
  leadIds: string[];
  batchDate?: string;
  briefingNotes?: Record<string, string>;
}) {
  const user = await requireManagerOrCOO();

  try {
    const closer = await prisma.employee.findUnique({
      where: { id: params.closerId },
      select: { id: true, name: true, role: true },
    });
    if (!closer || closer.role !== 'Closer') {
      return { success: false, error: 'Selected employee is not a Closer.' };
    }

    const batchDate = params.batchDate || toIstDateKey(new Date());
    const uniqueLeadIds = Array.from(new Set(params.leadIds.filter(Boolean)));
    if (uniqueLeadIds.length === 0) {
      return { success: false, error: 'Please select at least 1 lead to dispatch.' };
    }

    const existingToday = await prisma.closerLeadAssignment.findMany({
      where: {
        closerId: closer.id,
        batchDate,
        isRecycled: false,
      },
      orderBy: { slotNumber: 'asc' },
    });

    const existingLeadIdSet = new Set(existingToday.map((a) => a.leadId));
    const newLeadIds = uniqueLeadIds.filter((id) => !existingLeadIdSet.has(id));

    const remainingSlots = Math.max(
      0,
      CLOSER_CONSTANTS.DAILY_LEAD_QUOTA - existingToday.length
    );

    if (remainingSlots <= 0) {
      return {
        success: false,
        error: `${closer.name} already has ${CLOSER_CONSTANTS.DAILY_LEAD_QUOTA}/${CLOSER_CONSTANTS.DAILY_LEAD_QUOTA} leads assigned for ${batchDate}.`,
      };
    }

    const leadIdsToDispatch = newLeadIds.slice(0, remainingSlots);
    if (leadIdsToDispatch.length === 0) {
      return {
        success: false,
        error: 'All selected leads are already in today’s batch for this Closer.',
      };
    }

    const leadsToAssign = await prisma.lead.findMany({
      where: { leadId: { in: leadIdsToDispatch } },
    });

    if (leadsToAssign.length === 0) {
      return { success: false, error: 'Selected leads could not be found.' };
    }

    let nextSlot = existingToday.length + 1;
    const createdIds: string[] = [];

    for (const lead of leadsToAssign) {
      if (lead.status === 'Converted' || lead.status === 'Lost') continue;

      const note = (params.briefingNotes?.[lead.leadId] || '').trim() || null;

      await prisma.closerLeadAssignment.upsert({
        where: {
          leadId_closerId_batchDate: {
            leadId: lead.leadId,
            closerId: closer.id,
            batchDate,
          },
        },
        update: {
          isRecycled: false,
          disposition: 'UNWORKED',
          slotNumber: nextSlot,
          cooBriefingNote: note,
          assignedById: user.employeeId,
          assignedAt: new Date(),
        },
        create: {
          leadId: lead.leadId,
          closerId: closer.id,
          assignedById: user.employeeId,
          batchDate,
          slotNumber: nextSlot,
          cooBriefingNote: note,
          disposition: 'UNWORKED',
          callAttempts: 0,
          closerNotes: '',
        },
      });

      // Set Lead.closerId while keeping Lead.employeeId intact (original creator attribution)
      await prisma.lead.update({
        where: { leadId: lead.leadId },
        data: { closerId: closer.id },
      });

      createdIds.push(lead.leadId);
      nextSlot += 1;
    }

    if (createdIds.length === 0) {
      return {
        success: false,
        error: 'No eligible open leads were dispatched (Converted/Lost leads are skipped).',
      };
    }

    const totalForDay = existingToday.length + createdIds.length;
    await logAction('DISPATCH_CLOSER_LEADS', {
      closerId: closer.id,
      closerName: closer.name,
      batchDate,
      dispatchedCount: createdIds.length,
      totalForDay,
      leadIds: createdIds,
    });

    await createNotification(
      closer.id,
      `📋 ${user.name || user.role} handed you ${createdIds.length} lead${
        createdIds.length === 1 ? '' : 's'
      } for ${batchDate} (${totalForDay}/${CLOSER_CONSTANTS.DAILY_LEAD_QUOTA} today).`,
      '/'
    );

    await postBotChannelFeed(
      '#closer-desk',
      `📋 **[Daily Closer Handoff — ${batchDate}]** ${user.name || user.role} dispatched **${
        createdIds.length
      } lead${createdIds.length === 1 ? '' : 's'}** to **${closer.name}** (Queue: \`${totalForDay}/${
        CLOSER_CONSTANTS.DAILY_LEAD_QUOTA
      }\`).`
    );

    revalidatePath('/');
    revalidatePath('/coo');
    return {
      success: true,
      dispatchedCount: createdIds.length,
      totalForDay,
    };
  } catch (error: any) {
    console.error('dispatchCloserLeads error:', error);
    return { success: false, error: error.message || 'Failed to dispatch leads.' };
  }
}

/**
 * Closer (or COO/Manager) updates disposition, call attempts, closing notes, and follow-up date
 * on an assigned lead. Automatically syncs the underlying Lead status & notes.
 */
export async function updateCloserAssignment(params: {
  assignmentId: string;
  disposition: string;
  callAttempts?: number;
  closerNotes?: string;
  nextFollowUpDate?: string;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const existing = await prisma.closerLeadAssignment.findUnique({
      where: { id: params.assignmentId },
    });
    if (!existing) return { success: false, error: 'Assignment not found.' };

    const isSupervisor = user.role === 'Manager' || user.role === 'COO';
    if (!isSupervisor && existing.closerId !== user.employeeId) {
      return { success: false, error: 'Forbidden: You can only update your own assigned leads.' };
    }

    // Closers cannot directly mark CLOSED_WON without Manager/COO payment verification
    let normalizedDisposition = params.disposition;
    if (normalizedDisposition === 'CLOSED_WON' && !isSupervisor) {
      normalizedDisposition = 'PENDING_VERIFICATION';
    }

    const meta = getDispositionMeta(normalizedDisposition);
    const now = new Date();
    const callAttempts =
      params.callAttempts !== undefined
        ? Math.max(0, Number(params.callAttempts) || 0)
        : existing.callAttempts;

    const wasTouched = meta.countsAsWorked || callAttempts > 0;
    const firstTouchedAt = existing.firstTouchedAt || (wasTouched ? now : null);

    const updated = await prisma.closerLeadAssignment.update({
      where: { id: existing.id },
      data: {
        disposition: normalizedDisposition,
        callAttempts,
        closerNotes:
          params.closerNotes !== undefined ? params.closerNotes : existing.closerNotes,
        nextFollowUpDate:
          params.nextFollowUpDate !== undefined
            ? params.nextFollowUpDate || null
            : existing.nextFollowUpDate,
        firstTouchedAt,
        lastWorkedAt: now,
        ...(normalizedDisposition === 'CLOSED_WON' && { closedAt: now }),
      },
    });

    // Sync underlying Lead record while preserving Lead.employeeId
    const lead = await prisma.lead.findUnique({ where: { leadId: existing.leadId } });
    if (lead) {
      const leadUpdate: Record<string, any> = {
        closerId: existing.closerId,
      };

      if (meta.mapsToLeadStatus) {
        if (meta.mapsToLeadStatus === 'Converted' && !isSupervisor) {
          leadUpdate.status = 'Pending Verification';
        } else {
          leadUpdate.status = meta.mapsToLeadStatus;
          if (meta.mapsToLeadStatus === 'Converted' && lead.status !== 'Converted') {
            leadUpdate.convertedAt = now;
          }
        }
      }

      if (params.nextFollowUpDate !== undefined && params.nextFollowUpDate) {
        leadUpdate.followUp = params.nextFollowUpDate;
      }

      if (params.closerNotes && params.closerNotes.trim().length > 0) {
        const cleanNote = params.closerNotes.trim();
        const tag = `[Closer ${toIstDateKey(now)}]: ${cleanNote}`;
        if (!lead.notes?.includes(cleanNote)) {
          leadUpdate.notes = lead.notes ? `${lead.notes}\n${tag}` : tag;
        }
      }

      await prisma.lead.update({
        where: { leadId: lead.leadId },
        data: leadUpdate,
      });

      if (
        (leadUpdate.status === 'Pending Verification' || leadUpdate.status === 'Converted') &&
        lead.status !== leadUpdate.status
      ) {
        const supervisors = await prisma.employee.findMany({
          where: { role: { in: ['Manager', 'COO'] } },
          select: { id: true },
        });
        for (const sup of supervisors) {
          await createNotification(
            sup.id,
            `🏆 Closer ${user.name || user.email} moved ${lead.name} to ${leadUpdate.status}!`,
            '/approvals'
          );
        }
        await postBotChannelFeed(
          '#closer-desk',
          `🏆 **[Closer Deal Update]** **${user.name || user.email}** moved **${
            lead.name
          }** to \`${leadUpdate.status}\`.\n[LEAD:${lead.leadId}]`
        );
      }
    }

    await logAction('UPDATE_CLOSER_ASSIGNMENT', {
      assignmentId: updated.id,
      leadId: updated.leadId,
      disposition: updated.disposition,
      callAttempts: updated.callAttempts,
    });

    revalidatePath('/');
    revalidatePath('/coo');
    revalidatePath('/approvals');
    revalidatePath('/leaderboard');

    return { success: true, assignment: updated };
  } catch (error: any) {
    console.error('updateCloserAssignment error:', error);
    return { success: false, error: error.message || 'Failed to update assignment.' };
  }
}

/**
 * Closer submits their EOD Daily Report (9:00 PM IST deadline).
 * Auto-computes exact objective counts from today's 10-lead batch.
 * Allows submission even if unworkedCount > 0, highlighting unworked count prominently to COO & Managers.
 */
export async function submitCloserDailyReport(params: {
  reportDate?: string;
  winsSummary: string;
  topObjections: string;
  tomorrowHotClosures: string;
  supportNeededFromCoo: string;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'Closer') {
    return { success: false, error: 'Only Closers can submit a Closer EOD Report.' };
  }

  try {
    const now = new Date();
    const reportDate = params.reportDate || toIstDateKey(now);
    const { deadlineAt, isOnTime } = evaluateCloserEodSubmission(reportDate, now);

    const todayAssignmentsRaw = await prisma.closerLeadAssignment.findMany({
      where: {
        closerId: user.employeeId,
        batchDate: reportDate,
        isRecycled: false,
      },
    });

    const leadIds = todayAssignmentsRaw.map((a) => a.leadId);
    const relatedLeads =
      leadIds.length > 0
        ? await prisma.lead.findMany({ where: { leadId: { in: leadIds } } })
        : [];

    const leadsMap = new Map<string, Lead>(
      relatedLeads.map((row) => [
        row.leadId,
        {
          leadId: row.leadId,
          employeeId: row.employeeId,
          closerId: row.closerId || null,
          date: row.date,
          status: row.status,
          name: row.name,
          email: row.email,
          phone: row.phone,
          linkedIn: row.linkedIn,
          objections: row.objections,
          nextAction: row.nextAction,
          followUp: row.followUp,
          notes: row.notes,
          createdAt: row.createdAt,
          convertedAt: row.convertedAt || undefined,
          customFields: (row.customFields as Record<string, any>) || undefined,
        },
      ])
    );

    const serializedAssignments: CloserLeadAssignmentRecord[] = todayAssignmentsRaw.map((a) => ({
      ...a,
      assignedAt: a.assignedAt.toISOString(),
      firstTouchedAt: a.firstTouchedAt ? a.firstTouchedAt.toISOString() : null,
      lastWorkedAt: a.lastWorkedAt ? a.lastWorkedAt.toISOString() : null,
      closedAt: a.closedAt ? a.closedAt.toISOString() : null,
    }));

    const metrics = computeCloserBatchMetrics(serializedAssignments, leadsMap);

    const report = await prisma.closerDailyReport.upsert({
      where: {
        closerId_reportDate: {
          closerId: user.employeeId,
          reportDate,
        },
      },
      update: {
        deadlineAt,
        submittedAt: now,
        isOnTime,
        assignedCount: metrics.assignedCount,
        workedCount: metrics.workedCount,
        unworkedCount: metrics.unworkedCount,
        connectedCount: metrics.connectedCount,
        demosCount: metrics.demosCount,
        proposalsSentCount: metrics.proposalsSentCount,
        sentForVerificationCount: metrics.sentForVerificationCount,
        closedWonCount: metrics.closedWonCount,
        lostCount: metrics.lostCount,
        netRevenueClosed: metrics.netRevenueClosed,
        winsSummary: params.winsSummary.trim(),
        topObjections: params.topObjections.trim(),
        tomorrowHotClosures: params.tomorrowHotClosures.trim(),
        supportNeededFromCoo: params.supportNeededFromCoo.trim(),
      },
      create: {
        closerId: user.employeeId,
        reportDate,
        deadlineAt,
        submittedAt: now,
        isOnTime,
        assignedCount: metrics.assignedCount,
        workedCount: metrics.workedCount,
        unworkedCount: metrics.unworkedCount,
        connectedCount: metrics.connectedCount,
        demosCount: metrics.demosCount,
        proposalsSentCount: metrics.proposalsSentCount,
        sentForVerificationCount: metrics.sentForVerificationCount,
        closedWonCount: metrics.closedWonCount,
        lostCount: metrics.lostCount,
        netRevenueClosed: metrics.netRevenueClosed,
        winsSummary: params.winsSummary.trim(),
        topObjections: params.topObjections.trim(),
        tomorrowHotClosures: params.tomorrowHotClosures.trim(),
        supportNeededFromCoo: params.supportNeededFromCoo.trim(),
      },
    });

    await logAction('SUBMIT_CLOSER_EOD_REPORT', {
      reportId: report.id,
      reportDate,
      isOnTime,
      workedCount: metrics.workedCount,
      unworkedCount: metrics.unworkedCount,
      assignedCount: metrics.assignedCount,
    });

    const supervisors = await prisma.employee.findMany({
      where: { role: { in: ['COO', 'Manager'] } },
      select: { id: true },
    });

    const unworkedFlag =
      metrics.unworkedCount > 0 ? ` ⚠️ ${metrics.unworkedCount} UNWORKED` : ' ✅ All Worked';
    const timingLabel = isOnTime ? 'On-Time (≤ 9 PM IST)' : 'Late (> 9 PM IST)';

    for (const sup of supervisors) {
      await createNotification(
        sup.id,
        `📝 Closer EOD Report (${reportDate}) by ${user.name || user.email}: ${metrics.workedCount}/${metrics.assignedCount} worked${unworkedFlag} • ${timingLabel}`,
        '/coo'
      );
    }

    await postBotChannelFeed(
      '#closer-desk',
      `📝 **[Closer EOD Report — ${reportDate}]** **${user.name || user.email}** submitted (${timingLabel})\n• Queue: \`${metrics.workedCount}/${metrics.assignedCount} worked\`${unworkedFlag}\n• Connected: \`${metrics.connectedCount}\` | Proposals: \`${metrics.proposalsSentCount}\` | Sent for Verification: \`${metrics.sentForVerificationCount}\` | Closed Won: \`${metrics.closedWonCount}\``
    );

    revalidatePath('/');
    revalidatePath('/coo');
    return { success: true, report };
  } catch (error: any) {
    console.error('submitCloserDailyReport error:', error);
    return { success: false, error: error.message || 'Failed to submit EOD report.' };
  }
}

/**
 * COO or Manager/Founder reviews, rates, and acknowledges a Closer's EOD Daily Report.
 */
export async function reviewCloserDailyReport(params: {
  reportId: string;
  cooRating: string;
  cooFeedback: string;
}) {
  const user = await requireManagerOrCOO();

  try {
    const report = await prisma.closerDailyReport.update({
      where: { id: params.reportId },
      data: {
        cooReviewed: true,
        cooReviewedById: user.employeeId,
        cooReviewedAt: new Date(),
        cooRating: params.cooRating || 'MEETS',
        cooFeedback: (params.cooFeedback || '').trim(),
      },
    });

    await logAction('REVIEW_CLOSER_EOD_REPORT', {
      reportId: report.id,
      closerId: report.closerId,
      reportDate: report.reportDate,
      cooRating: report.cooRating,
    });

    await createNotification(
      report.closerId,
      `✅ ${user.name || user.role} reviewed your EOD Report (${report.reportDate}) — Rating: ${report.cooRating}.`,
      '/'
    );

    revalidatePath('/');
    revalidatePath('/coo');
    return { success: true, report };
  } catch (error: any) {
    console.error('reviewCloserDailyReport error:', error);
    return { success: false, error: error.message || 'Failed to review EOD report.' };
  }
}

/**
 * COO or Manager/Founder recycles an unclosed/unresponsive lead back to the open pool
 * while preserving the historical CloserLeadAssignment row for audit & metrics.
 */
export async function recycleCloserAssignment(assignmentId: string) {
  await requireManagerOrCOO();

  try {
    const existing = await prisma.closerLeadAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) return { success: false, error: 'Assignment not found.' };

    await prisma.closerLeadAssignment.update({
      where: { id: assignmentId },
      data: {
        isRecycled: true,
        disposition: 'RECYCLED',
      },
    });

    const lead = await prisma.lead.findUnique({ where: { leadId: existing.leadId } });
    if (lead && lead.status !== 'Converted' && lead.closerId === existing.closerId) {
      await prisma.lead.update({
        where: { leadId: lead.leadId },
        data: { closerId: null },
      });
    }

    await logAction('RECYCLE_CLOSER_LEAD', {
      assignmentId,
      leadId: existing.leadId,
      closerId: existing.closerId,
    });

    revalidatePath('/');
    revalidatePath('/coo');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to recycle lead.' };
  }
}

/**
 * COO or Manager/Founder removes an unworked lead from today's 10-lead batch so they can swap in another lead.
 */
export async function removeAssignmentFromBatch(assignmentId: string) {
  await requireManagerOrCOO();

  try {
    const existing = await prisma.closerLeadAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) return { success: false, error: 'Assignment not found.' };

    await prisma.closerLeadAssignment.delete({ where: { id: assignmentId } });

    // Check if the Closer still has any other active assignment for this lead; if not, clear Lead.closerId
    const otherActive = await prisma.closerLeadAssignment.findFirst({
      where: {
        leadId: existing.leadId,
        closerId: existing.closerId,
        isRecycled: false,
      },
    });
    if (!otherActive) {
      const lead = await prisma.lead.findUnique({ where: { leadId: existing.leadId } });
      if (lead && lead.closerId === existing.closerId && lead.status !== 'Converted') {
        await prisma.lead.update({
          where: { leadId: lead.leadId },
          data: { closerId: null },
        });
      }
    }

    revalidatePath('/');
    revalidatePath('/coo');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to remove lead from batch.' };
  }
}
