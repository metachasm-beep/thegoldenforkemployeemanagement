'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requireManager, requireManagerOrCOO, logAction, createNotification } from './core';
import {
  calculateNetRealizedRevenueShare,
  COO_CONTRACT_CONSTANTS,
} from '@/lib/cooCompensation';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes auto-idle cap

export async function sweepIdleCooSessions(employeeId?: string) {
  try {
    const activeSessions = await prisma.cooWorkSession.findMany({
      where: {
        status: 'ACTIVE',
        ...(employeeId ? { employeeId } : {}),
      },
    });

    const now = new Date();
    for (const s of activeSessions) {
      const elapsedSinceHeartbeat = now.getTime() - new Date(s.lastHeartbeatAt).getTime();
      if (elapsedSinceHeartbeat > IDLE_TIMEOUT_MS) {
        const cappedEnd = new Date(s.lastHeartbeatAt);
        const durationMinutes = Math.max(
          1,
          Math.round((cappedEnd.getTime() - new Date(s.startedAt).getTime()) / 60000)
        );
        await prisma.cooWorkSession.update({
          where: { id: s.id },
          data: {
            status: 'AUTO_PAUSED_IDLE',
            endedAt: cappedEnd,
            durationMinutes,
          },
        });
        await syncMonthlyLedgerHours(cappedEnd.toISOString().slice(0, 7), s.employeeId);
      }
    }
  } catch (e) {
    console.error('Failed to sweep idle COO sessions:', e);
  }
}

export async function syncMonthlyLedgerHours(monthStr: string, employeeId: string) {
  try {
    const sessions = await prisma.cooWorkSession.findMany({
      where: {
        employeeId,
        verifiedByFounder: true,
        status: { in: ['COMPLETED', 'AUTO_PAUSED_IDLE'] },
      },
    });

    const monthSessions = sessions.filter(
      (s) => new Date(s.startedAt).toISOString().slice(0, 7) === monthStr
    );
    const totalMinutes = monthSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const hoursLogged = Number((totalMinutes / 60).toFixed(2));

    const reports = await prisma.cooWeeklyReport.findMany({
      where: { employeeId },
    });
    const monthReports = reports.filter((r) => r.weekStartDate.startsWith(monthStr));
    const weeklyReportsSubmitted = monthReports.length;

    const existing = await prisma.cooMonthlyLedger.findUnique({ where: { month: monthStr } });
    const requiredReports = existing?.weeklyReportsRequired ?? 4;
    const qualifies =
      hoursLogged >= COO_CONTRACT_CONSTANTS.MIN_MONTHLY_HOURS_QUALIFICATION &&
      weeklyReportsSubmitted >= requiredReports;

    await prisma.cooMonthlyLedger.upsert({
      where: { month: monthStr },
      create: {
        month: monthStr,
        hoursLogged,
        weeklyReportsSubmitted,
        weeklyReportsRequired: requiredReports,
        qualifiesAsCompletedMonth: qualifies,
      },
      update: {
        hoursLogged,
        weeklyReportsSubmitted,
        qualifiesAsCompletedMonth: existing?.qualifiesAsCompletedMonth || qualifies,
      },
    });
  } catch (e) {
    console.error('Failed to sync monthly COO ledger hours:', e);
  }
}

export async function startCooWorkSession(formData: FormData) {
  const user = await requireManagerOrCOO();
  const employeeId = user.employeeId;
  const pillar = (formData.get('pillar') as string) || 'PILLAR_1_ONBOARDING';
  const taskTitle = (formData.get('taskTitle') as string) || 'Operational Execution';
  const notes = (formData.get('notes') as string) || '';
  const relatedLeadId = (formData.get('relatedLeadId') as string) || null;

  await sweepIdleCooSessions(employeeId);

  // Close any currently active session before starting a new one
  const existingActive = await prisma.cooWorkSession.findMany({
    where: { employeeId, status: 'ACTIVE' },
  });
  const now = new Date();
  for (const act of existingActive) {
    const mins = Math.max(
      1,
      Math.round((now.getTime() - new Date(act.startedAt).getTime()) / 60000)
    );
    await prisma.cooWorkSession.update({
      where: { id: act.id },
      data: { status: 'COMPLETED', endedAt: now, lastHeartbeatAt: now, durationMinutes: mins },
    });
  }

  const session = await prisma.cooWorkSession.create({
    data: {
      employeeId,
      pillar,
      taskTitle,
      notes,
      relatedLeadId,
      status: 'ACTIVE',
      startedAt: now,
      lastHeartbeatAt: now,
    },
  });

  await logAction('COO_START_SESSION', {
    sessionId: session.id,
    pillar,
    taskTitle,
  });

  revalidatePath('/coo');
  revalidatePath('/');
  return { success: true, sessionId: session.id };
}

export async function stopCooWorkSession(sessionId: string, closingNotes?: string) {
  const user = await requireManagerOrCOO();
  const existing = await prisma.cooWorkSession.findUnique({ where: { id: sessionId } });
  if (!existing) return { success: false, error: 'Session not found' };

  const now = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((now.getTime() - new Date(existing.startedAt).getTime()) / 60000)
  );

  const updated = await prisma.cooWorkSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      endedAt: now,
      lastHeartbeatAt: now,
      durationMinutes,
      notes: closingNotes !== undefined && closingNotes.trim() !== '' ? closingNotes : existing.notes,
    },
  });

  const monthStr = new Date(existing.startedAt).toISOString().slice(0, 7);
  await syncMonthlyLedgerHours(monthStr, existing.employeeId);

  await logAction('COO_COMPLETE_SESSION', {
    sessionId,
    pillar: updated.pillar,
    durationMinutes,
    stoppedBy: user.email,
  });

  revalidatePath('/coo');
  revalidatePath('/');
  return { success: true };
}

export async function toggleVerifyCooSession(sessionId: string, verified: boolean) {
  await requireManager(); // Strictly Sole Proprietor (Paul Marandi)
  const session = await prisma.cooWorkSession.update({
    where: { id: sessionId },
    data: {
      verifiedByFounder: verified,
      status: verified ? 'COMPLETED' : 'FLAGGED_BY_FOUNDER',
    },
  });

  const monthStr = new Date(session.startedAt).toISOString().slice(0, 7);
  await syncMonthlyLedgerHours(monthStr, session.employeeId);

  await logAction('FOUNDER_AUDIT_COO_SESSION', {
    sessionId,
    verifiedByFounder: verified,
  });

  revalidatePath('/coo');
  revalidatePath('/');
  return { success: true };
}

export async function submitCooWeeklyReport(formData: FormData) {
  const user = await requireManagerOrCOO();
  const employeeId = user.employeeId;

  const weekStartDate = formData.get('weekStartDate') as string;
  const weekEndDate = formData.get('weekEndDate') as string;
  const venuesOnboardedCount = Number(formData.get('venuesOnboardedCount') || 0);
  const activeTrialsMonitoredCount = Number(formData.get('activeTrialsMonitoredCount') || 0);
  const fieldDemosVerifiedCount = Number(formData.get('fieldDemosVerifiedCount') || 0);
  const b2bMilestonesDelivered = (formData.get('b2bMilestonesDelivered') as string) || '';
  const merchantEscalationsResolved = (formData.get('merchantEscalationsResolved') as string) || '';
  const nextWeekPriorities = (formData.get('nextWeekPriorities') as string) || '';

  // Deadline is Monday following weekEndDate at 10:00 AM IST (+05:30)
  const endObj = new Date(`${weekEndDate}T00:00:00+05:30`);
  const mondayDeadline = new Date(endObj.getTime() + 24 * 60 * 60 * 1000);
  mondayDeadline.setHours(10, 0, 0, 0);

  const now = new Date();
  const isOnTime = now <= mondayDeadline;

  // Aggregate hours logged during [weekStartDate, weekEndDate]
  const sessions = await prisma.cooWorkSession.findMany({
    where: {
      employeeId,
      verifiedByFounder: true,
    },
  });
  const weekSessions = sessions.filter((s) => {
    const dStr = new Date(s.startedAt).toISOString().slice(0, 10);
    return dStr >= weekStartDate && dStr <= weekEndDate;
  });
  const totalMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalHoursLogged = Number((totalMinutes / 60).toFixed(2));

  const report = await prisma.cooWeeklyReport.create({
    data: {
      employeeId,
      weekStartDate,
      weekEndDate,
      deadlineAt: mondayDeadline,
      submittedAt: now,
      isOnTime,
      totalHoursLogged,
      venuesOnboardedCount,
      activeTrialsMonitoredCount,
      fieldDemosVerifiedCount,
      b2bMilestonesDelivered,
      merchantEscalationsResolved,
      nextWeekPriorities,
    },
  });

  await syncMonthlyLedgerHours(weekStartDate.slice(0, 7), employeeId);

  await logAction('COO_SUBMIT_WEEKLY_REPORT', {
    reportId: report.id,
    weekStartDate,
    totalHoursLogged,
    isOnTime,
  });

  // Notify Sole Proprietor
  const managers = await prisma.employee.findMany({ where: { role: 'Manager' } });
  for (const m of managers) {
    await createNotification(
      m.id,
      `COO Weekly Activity Report submitted for week of ${weekStartDate} (${totalHoursLogged}h logged, ${isOnTime ? 'On-Time' : 'Late'})`,
      '/coo'
    );
  }

  revalidatePath('/coo');
  revalidatePath('/');
  return { success: true };
}

export async function acknowledgeCooWeeklyReport(reportId: string, founderNotes?: string) {
  await requireManager();
  await prisma.cooWeeklyReport.update({
    where: { id: reportId },
    data: {
      founderAcknowledged: true,
      founderNotes: founderNotes || 'Reviewed and verified by Sole Proprietor.',
    },
  });
  await logAction('FOUNDER_ACKNOWLEDGE_COO_REPORT', { reportId, founderNotes });
  revalidatePath('/coo');
  return { success: true };
}

export async function upsertMerchantDeployment(formData: FormData) {
  await requireManagerOrCOO();
  const id = formData.get('id') as string | null;
  const venueName = (formData.get('venueName') as string) || '';
  const venueType = (formData.get('venueType') as string) || 'Restaurant';
  const onboardingStatus = (formData.get('onboardingStatus') as string) || 'TRIAL_21_DAY';
  const trialStartDate = (formData.get('trialStartDate') as string) || new Date().toISOString().slice(0, 10);
  const subscribedModulesRaw = (formData.get('subscribedModules') as string) || '[]';
  const annualContractValue = Number(formData.get('annualContractValue') || 11999);
  const slaGoLiveDate = (formData.get('slaGoLiveDate') as string) || '';
  const notes = (formData.get('notes') as string) || '';

  // Compute 21-Day Free Trial expiry date (Section 3.3)
  const startObj = new Date(trialStartDate);
  const endObj = new Date(startObj.getTime() + 21 * 24 * 60 * 60 * 1000);
  const trialEndsAt = endObj.toISOString().slice(0, 10);

  let subscribedModules: string[] = [];
  try {
    subscribedModules = JSON.parse(subscribedModulesRaw);
  } catch {
    subscribedModules = subscribedModulesRaw ? subscribedModulesRaw.split(',').map((s) => s.trim()) : [];
  }

  if (id) {
    await prisma.merchantDeployment.update({
      where: { id },
      data: {
        venueName,
        venueType,
        onboardingStatus,
        trialStartDate,
        trialEndsAt,
        subscribedModules,
        annualContractValue,
        slaGoLiveDate,
        notes,
        demoVerifiedByCoo: true,
      },
    });
  } else {
    await prisma.merchantDeployment.create({
      data: {
        venueName,
        venueType,
        onboardingStatus,
        trialStartDate,
        trialEndsAt,
        subscribedModules,
        annualContractValue,
        slaGoLiveDate,
        notes,
        demoVerifiedByCoo: true,
      },
    });
  }

  await logAction('COO_UPSERT_MERCHANT_DEPLOYMENT', {
    venueName,
    venueType,
    onboardingStatus,
    annualContractValue,
  });

  revalidatePath('/coo');
  return { success: true };
}

export async function updateMerchantStage(id: string, onboardingStatus: string) {
  await requireManagerOrCOO();
  await prisma.merchantDeployment.update({
    where: { id },
    data: {
      onboardingStatus,
      lastHealthAuditDate: new Date().toISOString().slice(0, 10),
    },
  });
  await logAction('COO_UPDATE_MERCHANT_STAGE', { deploymentId: id, onboardingStatus });
  revalidatePath('/coo');
  return { success: true };
}

export async function verifyFieldDemoByCoo(leadId: string) {
  const user = await requireManagerOrCOO();
  const lead = await prisma.lead.findUnique({ where: { leadId } });
  if (!lead) return { success: false };

  const currentCustom = (lead.customFields as Record<string, any>) || {};
  const updatedCustom = {
    ...currentCustom,
    cooDemoVerified: true,
    cooVerifiedAt: new Date().toISOString(),
    cooVerifiedBy: user.email,
  };

  await prisma.lead.update({
    where: { leadId },
    data: { customFields: updatedCustom },
  });

  await logAction('COO_VERIFY_FIELD_DEMO', {
    leadId,
    venueName: lead.name,
    salesExecId: lead.employeeId,
  });

  revalidatePath('/coo');
  revalidatePath('/');
  return { success: true };
}

export async function upsertFounderMonthlyRevenueLedger(formData: FormData) {
  await requireManager(); // Strictly Sole Proprietor (Paul Marandi)

  const month = (formData.get('month') as string) || new Date().toISOString().slice(0, 7);
  const grossSettledInSbi = Number(formData.get('grossSettledInSbi') || 0);
  const gstExcluded = Number(formData.get('gstExcluded') || 0);
  const gatewayAndRefundDeductions = Number(formData.get('gatewayAndRefundDeductions') || 0);
  const disbursementStatus = (formData.get('disbursementStatus') as string) || 'STATEMENT_ISSUED';
  const qualifiesOverride = formData.get('qualifiesAsCompletedMonth') === 'true';
  const isEmergencyPause = formData.get('isEmergencyPause') === 'true';
  const pauseReason = (formData.get('pauseReason') as string) || null;

  const calc = calculateNetRealizedRevenueShare({
    grossSettledInSbi,
    gstExcluded,
    gatewayAndRefundDeductions,
    sharePercent: 3.0,
    tdsRatePercent: 10.0,
  });

  await prisma.cooMonthlyLedger.upsert({
    where: { month },
    create: {
      month,
      grossSettledInSbi,
      gstExcluded,
      gatewayAndRefundDeductions,
      netRealizedRevenue: calc.netRealizedRevenue,
      cooActiveSharePercent: 3.0,
      grossCooPayout: calc.grossCooPayout,
      tdsDeducted: calc.tdsDeducted,
      netCooPayout: calc.netCooPayout,
      disbursementStatus,
      qualifiesAsCompletedMonth: qualifiesOverride,
      isEmergencyPause,
      pauseReason,
      settledAt: disbursementStatus === 'PAID' ? new Date() : null,
    },
    update: {
      grossSettledInSbi,
      gstExcluded,
      gatewayAndRefundDeductions,
      netRealizedRevenue: calc.netRealizedRevenue,
      grossCooPayout: calc.grossCooPayout,
      tdsDeducted: calc.tdsDeducted,
      netCooPayout: calc.netCooPayout,
      disbursementStatus,
      qualifiesAsCompletedMonth: qualifiesOverride,
      isEmergencyPause,
      pauseReason,
      settledAt: disbursementStatus === 'PAID' ? new Date() : undefined,
    },
  });

  await logAction('FOUNDER_UPDATE_COO_MONTHLY_LEDGER', {
    month,
    netRealizedRevenue: calc.netRealizedRevenue,
    netCooPayout: calc.netCooPayout,
    qualifiesOverride,
    isEmergencyPause,
    disbursementStatus,
  });

  revalidatePath('/coo');
  revalidatePath('/');
  return { success: true };
}
