"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getOrgStats.useQuery();
  const { data: myTasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery({});

  if (statsLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 font-mono">
      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 01</h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Operational_Status</h1>
        <div className="h-[1px] w-full bg-neutral-100" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="border border-neutral-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">Active_Tasks</span>
            <Clock className="h-4 w-4 text-neutral-300" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{stats?.tasks.total || 0}</p>
        </div>
        <div className="border border-black bg-black text-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Critical_Overdue</span>
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{stats?.tasks.overdue || 0}</p>
        </div>
        <div className="border border-neutral-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">Efficiency_Rate</span>
            <CheckCircle2 className="h-4 w-4 text-neutral-300" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">
            {stats?.tasks.total ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 02</h2>
            <h3 className="text-xl font-bold tracking-tighter uppercase italic">Pending_Action_Items</h3>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-neutral-300">Viewing {myTasks?.length || 0} Entities</span>
        </div>
        
        <div className="border border-neutral-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Ref_ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Descriptor</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {myTasks?.map((task) => (
                <tr key={task.id} className="hover:bg-neutral-50 transition-none group cursor-pointer">
                  <td className="px-6 py-4 text-[10px] font-mono text-neutral-400">#{task.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{task.title}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-widest px-2 py-1",
                      task.priority === "urgent" ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"
                    )}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-neutral-400">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : "NO_LIMIT"}
                  </td>
                </tr>
              ))}
              {myTasks?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[10px] uppercase tracking-widest text-neutral-300">
                    Queue_Clear
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
