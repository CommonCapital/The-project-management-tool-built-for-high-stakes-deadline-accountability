"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, ShieldCheck, Mail, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = trpc.users.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 font-mono">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 05</h2>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Personnel_Registry</h1>
        </div>
        <Button className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-8 text-[10px] font-bold tracking-widest">
          INVITE_NEW_PERSONNEL
        </Button>
      </div>

      <div className="h-[1px] w-full bg-neutral-100" />

      <div className="border border-neutral-100">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Personnel_Entity</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Access_Level</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50 transition-none group">
                <td className="px-6 py-4">
                   <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-neutral-100 flex items-center justify-center text-[8px] font-bold">
                        {user.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-widest">{user.name}</span>
                        <span className="text-[8px] text-neutral-400 uppercase tracking-widest">{user.email}</span>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-3 w-3 text-neutral-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{user.role}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-neutral-100 text-neutral-600">
                     {user.isActive ? "ACTIVE" : "INACTIVE"}
                   </span>
                </td>
                <td className="px-6 py-4">
                   <Button variant="ghost" className="h-8 w-8 rounded-none p-0 hover:bg-neutral-200 transition-none">
                      <MoreVertical className="h-4 w-4" />
                   </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
