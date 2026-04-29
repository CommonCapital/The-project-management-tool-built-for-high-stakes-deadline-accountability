"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
  { name: "PROJECTS", href: "/projects", icon: Briefcase },
  { name: "TASKS", href: "/tasks", icon: CheckSquare },
  { name: "COMMUNICATIONS", href: "/chat", icon: MessageSquare },
  { name: "ANALYTICS", href: "/analytics", icon: BarChart3 },
];

const adminNavigation = [
  { name: "SYSTEM_ADMIN", href: "/admin", icon: ShieldAlert },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-neutral-100 bg-white font-mono">
      <div className="flex h-16 items-center border-b border-neutral-100 px-6">
        <span className="text-xl font-bold tracking-tighter uppercase italic">APEX</span>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-8">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                pathname.startsWith(item.href)
                  ? "bg-neutral-50 text-black border-l-2 border-black"
                  : "text-neutral-400 hover:bg-neutral-50 hover:text-black",
                "group flex items-center px-3 py-3 text-[10px] font-bold tracking-[0.2em] transition-none"
              )}
            >
              <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
              {item.name}
            </Link>
          ))}

          {role === "admin" && (
            <div className="mt-12 pt-4 border-t border-neutral-100">
              <p className="px-3 mb-2 text-[8px] uppercase tracking-[0.3em] text-neutral-300">Administrative</p>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    pathname.startsWith(item.href)
                      ? "bg-neutral-50 text-black border-l-2 border-black"
                      : "text-neutral-400 hover:bg-neutral-50 hover:text-black",
                    "group flex items-center px-3 py-3 text-[10px] font-bold tracking-[0.2em] transition-none"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="flex flex-shrink-0 border-t border-neutral-100 p-4">
        <Link
          href="/settings/profile"
          className="group block w-full flex-shrink-0"
        >
          <div className="flex items-center">
            <div>
              <div className="h-8 w-8 bg-black text-white flex items-center justify-center text-xs">
                U
              </div>
            </div>
            <div className="ml-3">
              <p className="text-[10px] font-bold tracking-widest text-neutral-900 uppercase">Profile</p>
              <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Active Session</p>
            </div>
            <Settings className="ml-auto h-4 w-4 text-neutral-300" />
          </div>
        </Link>
      </div>
    </div>
  );
}
