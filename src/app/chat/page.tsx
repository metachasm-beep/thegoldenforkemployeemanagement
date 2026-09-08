import DashboardLayout from '@/app/components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getEmployees } from '@/lib/db/employees';
import { getConversations } from '@/app/chatActions';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  const role = (session.user as any).role || 'Employee';
  const employeeId = (session.user as any).employeeId;

  const [employees, initialConversations] = await Promise.all([
    getEmployees(),
    getConversations(),
  ]);

  return (
    <DashboardLayout role={role}>
      <ChatClient 
        currentEmployeeId={employeeId}
        employees={employees}
        initialConversations={initialConversations}
      />
    </DashboardLayout>
  );
}
