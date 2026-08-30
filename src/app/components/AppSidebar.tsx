'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { Home, Users, BarChart3, Settings, LogOut, Target, Receipt, Calendar, CheckCircle } from "lucide-react"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const isManager = role === 'Manager' || role === 'Team Lead';

  const menuItems = [
    { title: "Dashboard", url: "/", icon: Home, group: "General" },
  ];

  const actionItems = [
    { title: "Log New Lead", url: "/leads/new", icon: Target },
    { title: "Log Expense", url: "/expenses/new", icon: Receipt },
    { title: "Request PTO", url: "/pto/new", icon: Calendar },
    { title: "Submit Invoice", url: "/invoices/new", icon: Receipt },
  ];

  const managerItems = [
    { title: "Team", url: "/team", icon: Users },
    { title: "Approvals", url: "/approvals", icon: CheckCircle },
    { title: "Reports", url: "/reports", icon: BarChart3 },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              GF
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white truncate">
              Golden Fork
            </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isManager && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
