"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Settings,
  ShieldAlert,
  ClipboardList,
  FileText,
  ChevronDown,
  Plus,
  Check,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

const navigation = [
  { name: "ACTIVE", href: "/dashboard", icon: LayoutDashboard },
  { name: "OPERATIONAL_BOARD", href: "/projects", icon: Briefcase },
  { name: "PHASE", href: "/calendar", icon: CalendarDays },
  { name: "TASK_QUEUE", href: "/tasks", icon: ClipboardList },
  { name: "COMMUNICATIONS", href: "/chat", icon: MessageSquare },
  { name: "INTELLIGENCE_OVERVIEW", href: "/analytics", icon: BarChart3 },
];

const adminNavigation = [
  { name: "PERSONNEL_ROSTER", href: "/admin/users", icon: ShieldAlert },
  { name: "AUDIT_LOG", href: "/admin/audit-log", icon: FileText },
];

function WorkspaceSwitcher({ currentOrgId }: { currentOrgId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: workspaces = [] } = trpc.workspaces.list.useQuery();
  const { data: currentWs } = trpc.workspaces.get.useQuery();

  const switchWs = trpc.workspaces.switchWorkspace.useMutation({
    onSuccess: async () => {
      await utils.users.me.invalidate();
      router.push("/dashboard");
      router.refresh();
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const createWs = trpc.workspaces.create.useMutation({
    onSuccess: async (data) => {
      toast.success("WORKSPACE_CREATED");
      await utils.users.me.invalidate();
      await utils.workspaces.list.invalidate();
      setCreateMode(false);
      setNewName("");
      setNewSlug("");
      router.push("/dashboard");
      router.refresh();
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!newName.trim() || !newSlug.trim()) return;
    createWs.mutate({ name: newName.trim(), slug: newSlug.trim() });
  };

  return (
    <div className="relative border-b border-neutral-100">
      <button
        onClick={() => { setOpen(o => !o); setCreateMode(false); }}
        className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-none"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Building2 className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest truncate">
            {currentWs?.name ?? "SELECT_WORKSPACE"}
          </span>
        </div>
        <ChevronDown className={cn("h-3 w-3 text-neutral-400 flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 bg-white border border-neutral-100 shadow-lg">
          <div className="py-1">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => ws.id !== currentOrgId ? switchWs.mutate({ orgId: ws.id }) : setOpen(false)}
                className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-none"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="h-5 w-5 bg-neutral-900 text-white flex items-center justify-center text-[6px] font-bold flex-shrink-0">
                    {ws.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[9px] uppercase tracking-widest truncate">{ws.name}</span>
                </div>
                {ws.id === currentOrgId && <Check className="h-3 w-3 text-black flex-shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t border-neutral-100">
            {!createMode ? (
              <button
                onClick={() => setCreateMode(true)}
                className="flex w-full items-center px-4 py-2.5 hover:bg-neutral-50 transition-none text-neutral-400 hover:text-black"
              >
                <Plus className="h-3 w-3 mr-2" />
                <span className="text-[8px] uppercase tracking-widest">NEW_WORKSPACE</span>
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <input
                  autoFocus
                  placeholder="Workspace name"
                  value={newName}
                  onChange={e => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="w-full border border-neutral-200 px-2 py-1.5 text-[9px] focus:outline-none focus:border-black uppercase bg-white"
                />
                <input
                  placeholder="slug"
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full border border-neutral-200 px-2 py-1.5 text-[9px] focus:outline-none focus:border-black bg-white"
                />
                <div className="flex space-x-1.5">
                  <button
                    onClick={handleCreate}
                    disabled={createWs.isPending || !newName || !newSlug}
                    className="flex-1 bg-black text-white text-[7px] uppercase tracking-widest py-1.5 disabled:opacity-40"
                  >
                    {createWs.isPending ? "..." : "CREATE"}
                  </button>
                  <button
                    onClick={() => setCreateMode(false)}
                    className="flex-1 border border-neutral-200 text-[7px] uppercase tracking-widest py-1.5"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ role, userName }: { role: string; userName?: string }) {
  const pathname = usePathname();
  const { data: me } = trpc.users.me.useQuery();

  return (
    <div className="flex h-full w-64 flex-col border-r border-neutral-100 bg-white font-mono">
      <div className="flex h-14 items-center border-b border-neutral-100 px-6">
        <span className="text-xl font-bold tracking-tighter uppercase italic">APEX</span>
      </div>
      <WorkspaceSwitcher currentOrgId={me?.orgId} />

      <div className="flex flex-1 flex-col overflow-y-auto pt-6">
        <nav className="flex-1 space-y-0.5 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                pathname.startsWith(item.href)
                  ? "bg-neutral-50 text-black border-l-2 border-black"
                  : "text-neutral-400 hover:bg-neutral-50 hover:text-black",
                "group flex items-center px-3 py-2.5 text-[9px] font-bold tracking-[0.18em] transition-none"
              )}
            >
              <item.icon className="mr-3 h-3.5 w-3.5 flex-shrink-0" />
              {item.name}
            </Link>
          ))}

          {(role === "admin" || role === "manager") && (
            <div className="mt-8 pt-4 border-t border-neutral-100">
              <p className="px-3 mb-2 text-[7px] uppercase tracking-[0.3em] text-neutral-300">Administrative</p>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    pathname.startsWith(item.href)
                      ? "bg-neutral-50 text-black border-l-2 border-black"
                      : "text-neutral-400 hover:bg-neutral-50 hover:text-black",
                    "group flex items-center px-3 py-2.5 text-[9px] font-bold tracking-[0.18em] transition-none"
                  )}
                >
                  <item.icon className="mr-3 h-3.5 w-3.5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="flex flex-shrink-0 border-t border-neutral-100 p-4">
        <Link href="/settings/profile" className="group block w-full flex-shrink-0">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {userName ? userName.slice(0, 2).toUpperCase() : "ME"}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-[9px] font-bold tracking-widest text-neutral-900 uppercase truncate">{userName ?? "Profile"}</p>
              <p className="text-[7px] font-medium text-neutral-400 uppercase tracking-widest">CONFIGURATION</p>
            </div>
            <Settings className="ml-auto h-3.5 w-3.5 text-neutral-300 group-hover:text-black" />
          </div>
        </Link>
      </div>
    </div>
  );
}
