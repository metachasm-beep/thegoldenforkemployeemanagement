import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour auto-idle standby

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = (session.user as any).employeeId;
    const body = await req.json().catch(() => ({}));
    const { sessionId, idleMs = 0 } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const workSession = await prisma.cooWorkSession.findUnique({
      where: { id: sessionId },
    });

    if (!workSession || workSession.employeeId !== employeeId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (workSession.status !== 'ACTIVE') {
      return NextResponse.json({ status: workSession.status });
    }

    const now = new Date();
    const startedAtMs = new Date(workSession.startedAt).getTime();
    const lastBeatMs = new Date(workSession.lastHeartbeatAt).getTime();
    const sessionAgeMs = Math.max(0, now.getTime() - startedAtMs);
    const elapsedSinceLastBeat = Math.max(0, now.getTime() - lastBeatMs);

    // A session can never be idle longer than the session itself has been running
    const effectiveClientIdleMs = Math.min(Number(idleMs) || 0, sessionAgeMs);

    // Auto-pause only if the session has been running for >1 hour AND either:
    // 1. Client genuinely had >=1 hour of inactivity since the session started, or
    // 2. Server received no heartbeat for >1 hour
    if (
      sessionAgeMs >= IDLE_TIMEOUT_MS &&
      (effectiveClientIdleMs >= IDLE_TIMEOUT_MS || elapsedSinceLastBeat > IDLE_TIMEOUT_MS)
    ) {
      const cappedEnd = new Date(Math.min(now.getTime(), lastBeatMs + IDLE_TIMEOUT_MS));
      const durationMinutes = Math.max(
        1,
        Math.round((cappedEnd.getTime() - startedAtMs) / 60000)
      );

      await prisma.cooWorkSession.update({
        where: { id: sessionId },
        data: {
          status: 'AUTO_PAUSED_IDLE',
          endedAt: cappedEnd,
          durationMinutes,
        },
      });

      return NextResponse.json({
        status: 'AUTO_PAUSED_IDLE',
        durationMinutes,
      });
    }

    const durationMinutes = Math.max(
      1,
      Math.round((now.getTime() - startedAtMs) / 60000)
    );

    // Only advance lastHeartbeatAt if the user was recently active in this tab
    const isTabActive = effectiveClientIdleMs < 2 * 60 * 1000;

    await prisma.cooWorkSession.update({
      where: { id: sessionId },
      data: {
        ...(isTabActive ? { lastHeartbeatAt: now } : {}),
        durationMinutes,
      },
    });

    return NextResponse.json({
      status: 'ACTIVE',
      durationMinutes,
    });
  } catch (error) {
    console.error('COO Heartbeat error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
