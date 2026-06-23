"use client";

import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const utils = trpc.useUtils();
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery();
  const { data: list = [] } = trpc.notifications.list.useQuery({ limit: 10 });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative outline-none">
        <Bell className="h-5 w-5 text-neutral-400 hover:text-black transition-none" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-none border border-neutral-100 bg-white font-mono shadow-xl p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Alerts_Queue</span>
          {unreadCount > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); markAllRead.mutate(); }}
              className="text-[7px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none"
            >
              Mark_All_Read
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {list.length === 0 ? (
            <div className="py-10 text-center text-[9px] text-neutral-300 uppercase tracking-widest">
              No_Pending_Alerts
            </div>
          ) : (
            list.map((n) => (
              <div
                key={n.id}
                onClick={(e) => { e.preventDefault(); if (!n.isRead) markRead.mutate({ id: n.id }); }}
                className={`flex flex-col px-4 py-3 border-b border-neutral-50 cursor-pointer hover:bg-neutral-50 transition-none ${!n.isRead ? "bg-neutral-50/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">{n.title}</span>
                  {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-black flex-shrink-0 mt-1" />}
                </div>
                <p className="text-[8px] text-neutral-400 mt-1 leading-relaxed">{n.body}</p>
                <span className="text-[6px] text-neutral-300 mt-1.5 uppercase tracking-widest">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
