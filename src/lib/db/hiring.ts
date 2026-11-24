import { Employee } from '@/types';
import { prisma } from '@/lib/prisma';
import { HiringRecord, toIstDateKey } from '@/lib/hiringMetrics';

const EXCLUDED_NAMES = new Set(['paul marandi', 'golden fork bot']);

type RawCreateEmployeeLog = {
  id: string;
  employeeId: string;
  details: string;
  timestamp: Date;
};

export function buildHiringRecords(
  createLogs: RawCreateEmployeeLog[],
  activeEmployees: Employee[]
): HiringRecord[] {
  const activeMap = new Map<string, Employee>();
  for (const emp of activeEmployees) {
    activeMap.set(emp.id, emp);
  }

  const records: HiringRecord[] = [];
  const seenEmployeeIds = new Set<string>();

  for (const log of createLogs) {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(log.details || '{}');
    } catch {
      parsed = {};
    }

    const hiredEmployeeId = String(parsed.employeeId || log.id);
    const activeHired = activeMap.get(hiredEmployeeId);
    const hiredEmployeeName = (activeHired?.name || parsed.name || 'Employee').trim();

    if (EXCLUDED_NAMES.has(hiredEmployeeName.toLowerCase())) {
      continue;
    }

    const hiredEmployeeRole = String(
      activeHired?.role || parsed.role || 'Sales Executive'
    ).trim();

    if (hiredEmployeeRole.toLowerCase().includes('bot')) {
      continue;
    }

    if (seenEmployeeIds.has(hiredEmployeeId)) {
      continue;
    }
    seenEmployeeIds.add(hiredEmployeeId);

    const actor = activeMap.get(log.employeeId);
    const hiredByName = (actor?.name || parsed.hiredByName || 'Management').trim();
    const hiredByRole = String(actor?.role || parsed.hiredByRole || 'Manager').trim();
    const isHrHire = hiredByRole === 'HR';

    const isoTimestamp = log.timestamp.toISOString();
    const hiredDateIST = toIstDateKey(log.timestamp);

    records.push({
      id: log.id,
      hiredEmployeeId,
      hiredEmployeeName,
      hiredEmployeeRole,
      hiredAt: isoTimestamp,
      hiredDateIST,
      hiredById: log.employeeId,
      hiredByName,
      hiredByRole,
      isHrHire,
      isCurrentlyActive: Boolean(activeHired),
    });
  }

  // Backfill any active non-bootstrap employee that has a startDate but no CREATE_EMPLOYEE log
  for (const emp of activeEmployees) {
    if (seenEmployeeIds.has(emp.id)) continue;
    if (!emp.startDate) continue;
    if (EXCLUDED_NAMES.has(emp.name.trim().toLowerCase())) continue;
    if (emp.role.toLowerCase().includes('bot')) continue;

    const dateIST = toIstDateKey(emp.startDate);
    records.push({
      id: `emp-${emp.id}`,
      hiredEmployeeId: emp.id,
      hiredEmployeeName: emp.name.trim(),
      hiredEmployeeRole: emp.role,
      hiredAt: `${dateIST}T00:00:00.000Z`,
      hiredDateIST: dateIST,
      hiredById: 'unknown',
      hiredByName: 'Management',
      hiredByRole: 'Manager',
      isHrHire: false,
      isCurrentlyActive: true,
    });
  }

  records.sort((a, b) => b.hiredAt.localeCompare(a.hiredAt));
  return records;
}

export async function getHiringRecords(activeEmployees: Employee[]): Promise<HiringRecord[]> {
  try {
    const createLogs = await prisma.auditLog.findMany({
      where: { action: 'CREATE_EMPLOYEE' },
      orderBy: { timestamp: 'desc' },
    });
    return buildHiringRecords(createLogs, activeEmployees);
  } catch (err) {
    console.error('Failed to load hiring records:', err);
    return [];
  }
}
