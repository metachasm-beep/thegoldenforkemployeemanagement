import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Fuse from 'fuse.js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const [employees, leads, ptoRequests] = await Promise.all([
      prisma.employee.findMany({ select: { id: true, name: true, role: true, email: true } }),
      prisma.lead.findMany({ select: { leadId: true, assignee: true, status: true, notes: true, employeeId: true } }),
      prisma.pTO.findMany({ select: { ptoId: true, employeeId: true, startDate: true, endDate: true, status: true } })
    ]);

    const searchableData = [
      ...employees.map(e => ({
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
