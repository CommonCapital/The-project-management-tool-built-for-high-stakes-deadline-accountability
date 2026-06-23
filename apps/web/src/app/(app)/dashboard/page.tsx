"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, Clock, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-black text-white",
  high: "bg-neutral-800 text-white",
  medium: "bg-neutral-100 text-neutral-600",
  low: "bg-neutral-50 text-neutral-400",
};

export default function DashboardPage() {
  const { data: me } = trpc.users.me.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getOrgStats.useQuery();
  const { data: personalStats } = trpc.analytics.getPersonalStats.useQuery();
  const { data: myTasks, isLoading: tasksLoading, refetch } = trpc.tasks.myTasks.useQuery();
  const { data: workspace } = trpc.workspaces.get.useQuery();

  const submitCompletion = trpc.tasks.submitCompletion.useMutation({
    onSuccess: () => { toast.success("SUBMITTED_FOR_REVIEW"); refetch(); },
    onError: () => toast.error("SUBMISSION_FAILED"),
  });

  const isManager = me?.role === "admin" || me?.role === "manager";

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
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">
          {workspace?.name ?? "Workspace"} // Operational_Status
        </h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">
          Welcome, {me?.name?.split(" ")[0] ?? "Agent"}
        </h1>
        <div className="h-[1px] w-full bg-neutral-100" />
      </div>

      {/* Personal stats */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <div className="border border-neutral-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">My_Tasks</span>
            <Clock className="h-4 w-4 text-neutral-200" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{Number(personalStats?.total ?? 0)}</p>
        </div>
        <div className="border border-neutral-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">In_Progress</span>
            <Clock className="h-4 w-4 text-neutral-200" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{Number(personalStats?.inProgress ?? 0)}</p>
        </div>
        <div className={cn("p-6 space-y-3", Number(personalStats?.overdue ?? 0) > 0 ? "border border-black bg-black text-white" : "border border-neutral-100")}>
          <div className="flex items-center justify-between">
            <span className={cn("text-[8px] uppercase tracking-widest", Number(personalStats?.overdue ?? 0) > 0 ? "text-neutral-400" : "text-neutral-400")}>Overdue</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{Number(personalStats?.overdue ?? 0)}</p>
        </div>
        <div className="border border-neutral-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-neutral-200" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{Number(personalStats?.completed ?? 0)}</p>
        </div>
      </div>

      {/* Org stats for managers */}
      {isManager && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Org_Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-neutral-100 p-4 space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-neutral-300">Total_Tasks</span>
              <p className="text-2xl font-bold">{Number(stats?.tasks.total ?? 0)}</p>
            </div>
            <div className="border border-neutral-100 p-4 space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-neutral-300">Projects</span>
              <p className="text-2xl font-bold">{Number(stats?.projects ?? 0)}</p>
            </div>
            <div className="border border-neutral-100 p-4 space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-neutral-300">Pending_Review</span>
              <p className="text-2xl font-bold">{Number(stats?.tasks.inReview ?? 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* My task list */}
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 02</h2>
            <h3 className="text-xl font-bold tracking-tighter uppercase italic">My_Assignments</h3>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-neutral-300">
            {myTasks?.filter(t => t.status !== "done").length ?? 0} active
          </span>
        </div>

        <div className="border border-neutral-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Task</th>
                <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Priority</th>
                <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Deadline</th>
                <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {myTasks?.filter(t => t.status !== "done").map(task => (
                <tr key={task.id} className="hover:bg-neutral-50 transition-none">
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-wide">{task.title}</td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-1", PRIORITY_STYLES[task.priority])}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500">{task.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-neutral-400">
                    {task.deadline ? (
                      <span className={new Date(task.deadline) < new Date() ? "text-red-500 font-bold" : ""}>
                        {format(new Date(task.deadline), "MMM d, yyyy")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {task.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => submitCompletion.mutate({ taskId: task.id })}
                        disabled={submitCompletion.isPending}
                        className="h-6 rounded-none bg-black text-white hover:bg-neutral-800 text-[8px] uppercase tracking-widest px-3 transition-none"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        SUBMIT
                      </Button>
                    )}
                    {task.status === "review" && (
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400">PENDING_REVIEW</span>
                    )}
                  </td>
                </tr>
              ))}
              {myTasks?.filter(t => t.status !== "done").length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[10px] uppercase tracking-widest text-neutral-300">
                    Queue_Clear — No Active Assignments
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
