import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { Employee } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

// Role → visual identity mapping
const ROLE_STYLE: Record<string, { avatar: string; badge: string; badgeText: string; dot: string }> = {
  Manager: {
    avatar: 'from-violet-600 to-indigo-600',
    badge: 'bg-violet-500/20 text-violet-200 border border-violet-400/30',
    badgeText: 'Manager',
    dot: 'bg-violet-400 shadow-[0_0_10px_theme(colors.violet.400)]',
  },
  HR: {
    avatar: 'from-sky-500 to-cyan-500',
    badge: 'bg-sky-500/20 text-sky-200 border border-sky-400/30',
    badgeText: 'HR',
    dot: 'bg-sky-400 shadow-[0_0_10px_theme(colors.sky.400)]',
  },
  'Team Lead': {
    avatar: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
    badgeText: 'Team Lead',
    dot: 'bg-amber-400 shadow-[0_0_10px_theme(colors.amber.400)]',
  },
  'Sales Executive': {
    avatar: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
    badgeText: 'Sales Exec',
    dot: 'bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]',
  },
};

function getRoleStyle(role: string) {
  return ROLE_STYLE[role] ?? {
    avatar: 'from-gray-500 to-gray-600',
    badge: 'bg-white/10 text-white/60 border border-white/20',
    badgeText: role,
    dot: 'bg-gray-400',
  };
}

function getChildren(employee: Employee, allEmployees: Employee[]) {
  const explicitReports = allEmployees.filter(e => e.managerId === employee.id);
  const isTreeFlat = allEmployees.every(e => !e.managerId);
  
  if (!isTreeFlat) {
    return explicitReports;
  }

  // Fallback seniority hierarchy if DB lacks managerId links
  // Prevent duplication by only attaching reports to the FIRST Manager/Team Lead
  const isFirstManager = allEmployees.find(e => e.role === 'Manager')?.id === employee.id;
  const isFirstTeamLead = allEmployees.find(e => e.role === 'Team Lead')?.id === employee.id;

  if (employee.role === 'Manager' && isFirstManager) {
    return allEmployees.filter(e => e.role === 'HR' || e.role === 'Team Lead');
  }
  if (employee.role === 'Team Lead' && isFirstTeamLead) {
    return allEmployees.filter(e => e.role === 'Sales Executive');
  }
  return [];
}

function OrgNode({ employee, allEmployees, depth = 0 }: {
  employee: Employee;
  allEmployees: Employee[];
  depth?: number;
}) {
  const directReports = getChildren(employee, allEmployees);
  const s = getRoleStyle(employee.role);
  const initials = employee.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className="group relative flex flex-col items-center text-center rounded-2xl p-4 w-44 cursor-default
          transition-all duration-300 hover:-translate-y-1
          bg-white/10 backdrop-blur-xl border border-white/25
          shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]
          hover:shadow-[0_16px_48px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]
          hover:border-white/40"
        style={{ WebkitBackdropFilter: 'blur(20px)' }}
      >
        {/* Glow dot */}
        <div className={`w-2 h-2 rounded-full mb-2 ${s.dot}`} />

        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${s.avatar} flex items-center justify-center mb-2 border-2 border-white/30 overflow-hidden flex-shrink-0`}>
          {employee.avatarUrl ? (
            <Image src={employee.avatarUrl} alt={employee.name} width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <span className="text-white font-bold text-sm">{initials}</span>
          )}
        </div>

        {/* Name + Role */}
        <p className="font-semibold text-white text-sm leading-tight line-clamp-1">{employee.name}</p>
        <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{employee.role}</p>

        {/* Role badge */}
        <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${s.badge}`}>
          {s.badgeText}
        </span>
      </div>

      {/* Children */}
      {directReports.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical stem down from card */}
          <div
            className="w-px h-8"
            style={{ background: 'linear-gradient(to bottom, rgba(167,139,250,0.8), rgba(99,102,241,0.4))' }}
          />

          {/* Horizontal bar + children */}
          <div className="flex gap-5 items-start relative">
            {/* Horizontal connector bar */}
            {directReports.length > 1 && (
              <div
                className="absolute top-0 left-[calc(50%/var(--kids))] right-[calc(50%/var(--kids))] h-px"
                style={{
                  background: 'linear-gradient(90deg, rgba(139,92,246,0.0), rgba(139,92,246,0.7), rgba(99,102,241,0.7), rgba(99,102,241,0.0))',
                  left: `calc(100% / ${directReports.length * 2})`,
                  right: `calc(100% / ${directReports.length * 2})`,
                }}
              />
            )}

            {directReports.map(report => (
              <div key={report.id} className="flex flex-col items-center">
                {/* Short vertical drop from horizontal bar to child card */}
                <div
                  className="w-px h-7"
                  style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.6), rgba(99,102,241,0.2))' }}
                />
                <OrgNode employee={report} allEmployees={allEmployees} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function OrgChartPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect('/');
  const role = (session.user as any).role;

  if (role !== 'Manager' && role !== 'Team Lead' && role !== 'HR') {
    redirect('/');
  }

  const allEmployees = await getEmployees();

  const isTreeFlat = allEmployees.every(e => !e.managerId);
  let roots: Employee[] = [];
  
  if (isTreeFlat && allEmployees.length > 0) {
    roots = allEmployees.filter(e => e.role === 'Manager');
    if (roots.length === 0) roots = allEmployees.filter(e => e.role === 'Team Lead');
    if (roots.length === 0) roots = allEmployees.filter(e => e.role === 'HR');
    if (roots.length === 0) roots = allEmployees;
  } else {
    roots = allEmployees.filter(e => !e.managerId);
    if (roots.length === 0 && allEmployees.length > 0) {
      roots = [allEmployees[0]];
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Company Structure</h1>
            <p className="text-white/50 text-sm mt-1">Hierarchy · GoldenFork Management</p>
          </div>
          <Link
            href="/team"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              bg-white/10 hover:bg-white/20 text-white/80 hover:text-white
              border border-white/20 hover:border-white/40 backdrop-blur-sm"
          >
            ← Back to Team
          </Link>
        </div>

        {/* Role legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_STYLE).map(([r, s]) => (
            <span key={r} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.badgeText}
            </span>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1a0533 0%, #0d1b4b 45%, #001133 100%)',
            minHeight: '600px',
          }}
        >
          {/* Aurora blobs */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                'radial-gradient(ellipse 60% 50% at 25% 15%, rgba(139,92,246,0.35) 0%, transparent 60%)',
                'radial-gradient(ellipse 50% 60% at 80% 70%, rgba(59,130,246,0.28) 0%, transparent 60%)',
                'radial-gradient(ellipse 40% 40% at 60% 10%, rgba(99,102,241,0.2) 0%, transparent 50%)',
              ].join(','),
            }}
          />

          {/* Scrollable tree area */}
          <div className="relative z-10 overflow-x-auto overflow-y-auto p-12">
            <div className="flex justify-center gap-16 min-w-max">
              {roots.map(root => (
                <OrgNode key={root.id} employee={root} allEmployees={allEmployees} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer count */}
        <p className="text-white/30 text-xs text-right">
          {allEmployees.length} team member{allEmployees.length !== 1 ? 's' : ''} · Live data
        </p>
      </div>
    </DashboardLayout>
  );
}



