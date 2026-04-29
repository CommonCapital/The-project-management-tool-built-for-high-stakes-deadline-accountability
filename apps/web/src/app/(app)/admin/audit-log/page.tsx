"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuditLogPage() {
  const { data: logs = [], isLoading } = trpc.analytics.getAuditLog.useQuery({ limit: 50 });

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
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 06</h2>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">System_Audit_Log</h1>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" className="rounded-none border-neutral-200 text-[10px] font-bold tracking-widest py-6 px-8 transition-none">
            <Filter className="mr-2 h-4 w-4" />
            FILTER_LOGS
          </Button>
          <Button className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-8 text-[10px] font-bold tracking-widest">
            <Download className="mr-2 h-4 w-4" />
            EXPORT_CSV
          </Button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-neutral-100" />

      <div className="border border-neutral-100">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Actor</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Action</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-neutral-50 transition-none group">
                <td className="px-6 py-4 text-[10px] font-mono text-neutral-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  {log.userId || "SYSTEM"}
                </td>
                <td className="px-6 py-4">
                   <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-neutral-100 text-neutral-600">
                     {log.action}
                   </span>
                </td>
                <td className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-400">
                  {log.entityType} // {log.entityId?.slice(0, 8)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[10px] uppercase tracking-widest text-neutral-300">
                  Log_Buffer_Empty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
