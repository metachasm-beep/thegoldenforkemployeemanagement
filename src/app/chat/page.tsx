import DashboardLayout from "@/app/components/DashboardLayout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getEmployees } from "@/lib/db/employees";
import { getConversations, syncGlobalChannels } from "@/app/chatActions";
import ChatThemes from "./ChatThemes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ impersonate?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const { impersonate } = await searchParams;
  const isManager = (session.user as any).role === "Manager" || (session.user as any).role === "HR";

  if (impersonate && !isManager) {
    redirect("/chat");
  }

  const role = (session.user as any).role || "Employee";
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
    layoutRole = impEmp?.role || "Employee";
  }

  return (
    <DashboardLayout role={layoutRole}>
      <div className="max-w-7xl mx-auto space-y-4">
        {isImpersonating && (
          <div className="flex items-center gap-4 bg-red-100 text-red-800 p-4 rounded-2xl border border-red-200">
            <Link href="/team" className="p-2 hover:bg-red-200 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-bold text-lg">God Mode (Read-Only Chat)</h1>
              <p className="text-sm">You are currently viewing the chat history for an employee. Sending messages is disabled.</p>
            </div>
          </div>
        )}
        
        <ChatThemes
          currentEmployeeId={employeeId}
          employees={employees}
          initialConversations={initialConversations}
          isImpersonating={isImpersonating}
        />
      </div>
    </DashboardLayout>
  );
}
