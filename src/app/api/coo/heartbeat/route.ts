import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

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
    const elapsedSinceLastBeat = now.getTime() - new Date(workSession.lastHeartbeatAt).getTime();

    // Auto-pause if client reported >15 min idle or if server detected >15 min gap
    if (idleMs >= IDLE_TIMEOUT_MS || elapsedSinceLastBeat > IDLE_TIMEOUT_MS) {
      const cappedEnd = new Date(workSession.lastHeartbeatAt);
      const durationMinutes = Math.max(
        1,
        Math.round((cappedEnd.getTime() - new Date(workSession.startedAt).getTime()) / 60000)
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
      Math.round((now.getTime() - new Date(workSession.startedAt).getTime()) / 60000)
    );

    await prisma.cooWorkSession.update({
      where: { id: sessionId },
      data: {
        lastHeartbeatAt: now,
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
