import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Fuse from 'fuse.js';

export async function GET(request: Request) {
  // [SECURITY] Require an authenticated session — previously this endpoint
  // was completely unauthenticated, exposing all employee PII, lead notes,
  // and PTO records to any unauthenticated caller.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  const isManagerOrHR = user.role === 'Manager' || user.role === 'HR';

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    // [SECURITY] Scope data by role — regular employees only see their own leads and PTOs
    const [employees, leads, ptoRequests] = await Promise.all([
      // All roles can search employees (for contact lookup), but only basic fields
      prisma.employee.findMany({ 
        where: { 
          name: { not: 'Paul Marandi' },
          role: { not: 'System Bot' }
        },
        select: { id: true, name: true, role: true, email: true } 
      }),
      // Managers/HR see all leads; others only see their own
      prisma.lead.findMany({
        where: isManagerOrHR ? {} : { employeeId: user.employeeId },
        select: { leadId: true, assignee: true, status: true, notes: true, employeeId: true }
      }),
      // Managers/HR see all PTO; others only see their own
      prisma.pTO.findMany({
        where: isManagerOrHR ? {} : { employeeId: user.employeeId },
        select: { ptoId: true, employeeId: true, startDate: true, endDate: true, status: true }
      })
    ]);

    const searchableData = [
      ...employees
        .filter(e => !e.role.toLowerCase().includes('bot'))
        .map(e => ({
        id: e.id,
        type: 'Employee',
        title: e.name,
        subtitle: e.role,
        description: e.email,
        url: `/team`
      })),
      ...leads.map(l => ({
        id: l.leadId,
        type: 'Lead',
        title: l.assignee || 'Unnamed Lead',
        subtitle: l.status,
        description: l.notes || '',
        url: `/`
      })),
      ...ptoRequests.map(p => ({
        id: p.ptoId,
        type: 'PTO Request',
        title: `PTO - ${p.status}`,
        subtitle: 'Leave Request',
        description: `From ${p.startDate} to ${p.endDate}`,
        url: `/approvals`
      }))
    ];

    if (!q) {
      return NextResponse.json({ results: searchableData.slice(0, 15) });
    }

    const fuse = new Fuse(searchableData, {
      keys: ['title', 'subtitle', 'description'],
      threshold: 0.4,
      includeScore: true
    });

    const results = fuse.search(q).map(result => result.item).slice(0, 15);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
