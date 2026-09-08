import DashboardLayout from "@/app/components/DashboardLayout";
import { getEmployees } from "@/lib/db/employees";
import { getConversations } from "@/app/chatActions";
import ChatThemes from "./ChatThemes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const emps = await getEmployees();
  const mgr = emps.find(e => e.role === 'Manager') || emps[0];
  
  return (
    <div className="max-w-7xl mx-auto space-y-4 p-8">
      <h1 className="text-xl font-bold mb-4">Preview Mode (No Sign-in)</h1>
      <ChatThemes 
        currentEmployeeId={mgr.id} 
        employees={emps} 
        initialConversations={await getConversations(mgr.id)} 
        isImpersonating={false} 
      />
    </div>
  );
}
