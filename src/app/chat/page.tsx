import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getConversations, syncGlobalChannels } from '@/app/chatActions';
import ChatClient from './ChatClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ impersonate?: string }>;
}) {
  const session = await getServerSession(authOptions);
  // Bypass for preview
  if (!session || !session.user) {
    const emps = await getEmployees();
    const mgr = emps.find((e) => e.role === 'Manager') || emps[0];
    return (
      <div className="w-full h-dvh flex flex-col overflow-hidden">
        <ChatClient
          currentEmployeeId={mgr.id}
          employees={emps}
          initialConversations={await getConversations(mgr.id)}
          isImpersonating={false}
        />
      </div>
    );
  }
  if (!session || !session.user) redirect('/login');

  const { impersonate } = await searchParams;
  const isManager =
    (session.user as any).role === 'Manager' || (session.user as any).role === 'HR';

  if (impersonate && !isManager) {
    redirect('/chat');
  }

  const role = (session.user as any).role || 'Employee';
  let employeeId = (session.user as any).employeeId;
  let isImpersonating = false;
  let layoutRole = role;

  if (impersonate && isManager) {
    employeeId = impersonate;
    isImpersonating = true;
  } else {
    await syncGlobalChannels();
  }

  const [employees, initialConversations] = await Promise.all([
    getEmployees(),
    getConversations(employeeId),
  ]);

  if (isImpersonating) {
    const impEmp = employees.find((e) => e.id === employeeId);
    layoutRole = impEmp?.role || 'Employee';
  }

  return (
    <DashboardLayout role={layoutRole}>
      <div className="w-full h-full flex flex-col overflow-hidden">
        {isImpersonating && (
          <div className="flex items-center gap-3 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 px-6 py-2.5 border-b border-red-200 dark:border-red-900 shrink-0">
            <Link
              href="/team"
              className="p-1.5 hover:bg-red-200 dark:hover:bg-red-900 rounded-full transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-bold text-sm">God Mode (Read-Only Chat)</h1>
              <p className="text-xs opacity-80">
                You are currently viewing the chat history for an employee. Sending messages is
                disabled.
              </p>
            </div>
          </div>
        )}

        <ChatClient
          currentEmployeeId={employeeId}
          employees={employees}
          initialConversations={initialConversations}
          isImpersonating={isImpersonating}
        />
      </div>
    </DashboardLayout>
  );
}
