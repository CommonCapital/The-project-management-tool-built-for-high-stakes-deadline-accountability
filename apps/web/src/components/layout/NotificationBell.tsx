"use client";

import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery();
  const { data: list = [] } = trpc.notifications.list.useQuery({ limit: 5 });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative outline-none">
        <Bell className="h-5 w-5 text-neutral-400 hover:text-black transition-none" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-none border border-neutral-100 bg-white font-mono shadow-xl">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] py-3 px-4">Alerts_Queue</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-100" />
        <div className="max-h-64 overflow-y-auto">
          {list.length === 0 ? (
            <div className="py-8 text-center text-[10px] text-neutral-300 uppercase tracking-widest">
              No Pending Alerts
            </div>
          ) : (
            list.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start px-4 py-3 rounded-none focus:bg-neutral-50 cursor-pointer">
                <span className="text-[10px] font-bold uppercase tracking-widest">{notification.title}</span>
                <p className="text-[8px] text-neutral-400 mt-1 uppercase tracking-widest leading-relaxed">
                  {notification.body}
                </p>
                <span className="text-[6px] text-neutral-300 mt-2 uppercase">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="bg-neutral-100" />
        <DropdownMenuItem className="justify-center py-3 text-[8px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-50 transition-none cursor-pointer">
          View_All_Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
