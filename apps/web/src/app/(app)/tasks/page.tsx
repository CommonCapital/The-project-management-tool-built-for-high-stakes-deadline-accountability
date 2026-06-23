"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle, Send, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type StatusFilter = "all" | "todo" | "in_progress" | "review" | "done" | "blocked";

const STATUS_LABELS: Record<string, string> = {
  todo: "TODO",
  in_progress: "IN_PROGRESS",
  review: "REVIEW",
  done: "DONE",
  blocked: "BLOCKED",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-600 bg-red-50",
  high: "text-orange-600 bg-orange-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-neutral-500 bg-neutral-50",
};

export default function TasksPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; taskId: string; taskTitle: string }>({
    open: false, taskId: "", taskTitle: "",
  });
  const [rejectNote, setRejectNote] = useState("");

  const { data: me } = trpc.users.me.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery({
    status: filter === "all" ? undefined : filter,
  });

  const submitCompletion = trpc.tasks.submitCompletion.useMutation({
    onSuccess: () => { toast.success("SUBMITTED_FOR_REVIEW"); refetch(); },
    onError: () => toast.error("SUBMISSION_FAILED"),
  });

  const approveCompletion = trpc.tasks.approveCompletion.useMutation({
    onSuccess: () => { toast.success("TASK_APPROVED"); refetch(); },
    onError: () => toast.error("APPROVAL_FAILED"),
  });

  const rejectCompletion = trpc.tasks.rejectCompletion.useMutation({
    onSuccess: () => {
      toast.success("COMPLETION_REJECTED");
      setRejectModal({ open: false, taskId: "", taskTitle: "" });
      setRejectNote("");
      refetch();
    },
    onError: () => toast.error("REJECTION_FAILED"),
  });

  const isManager = me?.role === "admin" || me?.role === "manager";

  const getUserName = (id: string | null) => {
    if (!id) return "—";
    return users?.find(u => u.id === id)?.name ?? id.slice(0, 8);
  };

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "ALL", value: "all" },
    { label: "TODO", value: "todo" },
    { label: "IN_PROGRESS", value: "in_progress" },
    { label: "REVIEW", value: "review" },
    { label: "DONE", value: "done" },
    { label: "BLOCKED", value: "blocked" },
  ];

  return (
    <div className="space-y-8 font-mono">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Operations</p>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Task_Registry</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-0 border-b border-neutral-100">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-3 text-[10px] font-bold tracking-[0.2em] border-b-2 transition-none ${
              filter === tab.value
                ? "border-black text-black"
                : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            {tab.label}
            {tab.value === "review" && tasks?.filter(t => t.status === "review").length ? (
              <span className="ml-2 bg-black text-white text-[8px] px-1.5 py-0.5">
                {tasks.filter(t => t.status === "review").length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !tasks?.length ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-neutral-300">NO_TASKS_FOUND</p>
        </div>
      ) : (
        <div className="space-y-0 border border-neutral-100">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
            {["TASK", "PROJECT", "ASSIGNEE", "PRIORITY", "STATUS", "DEADLINE", "ACTIONS"].map(h => (
              <div key={h} className={`text-[8px] uppercase tracking-widest text-neutral-400 font-bold ${h === "TASK" ? "col-span-3" : h === "ACTIONS" ? "col-span-2" : "col-span-1"}`}>
                {h}
              </div>
            ))}
          </div>

          {tasks.map(task => {
            const isMyTask = task.assigneeId === me?.id;
            const canSubmit = isMyTask && task.status === "in_progress";
            const canApprove = isManager && task.status === "review";

            return (
              <div key={task.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 items-center">
                <div className="col-span-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-black truncate">{task.title}</p>
                  {task.completionNote && task.status === "review" && (
                    <p className="text-[9px] text-neutral-400 truncate mt-0.5">Note: {task.completionNote}</p>
                  )}
                </div>
                <div className="col-span-1 text-[9px] text-neutral-400 truncate">{task.projectId.slice(0, 8)}</div>
                <div className="col-span-1 text-[9px] text-neutral-500">{getUserName(task.assigneeId)}</div>
                <div className="col-span-1">
                  <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-wider ${
                    task.status === "done" ? "bg-black text-white" :
                    task.status === "review" ? "bg-neutral-800 text-white" :
                    task.status === "in_progress" ? "bg-neutral-200 text-black" :
                    task.status === "blocked" ? "bg-red-100 text-red-700" :
                    "bg-neutral-100 text-neutral-500"
                  }`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
                <div className="col-span-1 text-[9px] text-neutral-400">
                  {task.deadline ? (
                    <span className={new Date(task.deadline) < new Date() && task.status !== "done" ? "text-red-500" : ""}>
                      {format(new Date(task.deadline), "MMM d")}
                    </span>
                  ) : "—"}
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  {canSubmit && (
                    <Button
                      size="sm"
                      onClick={() => submitCompletion.mutate({ taskId: task.id })}
                      disabled={submitCompletion.isPending}
                      className="h-6 rounded-none bg-black text-white hover:bg-neutral-800 text-[8px] uppercase tracking-widest px-2 transition-none"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      SUBMIT
                    </Button>
                  )}
                  {canApprove && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => approveCompletion.mutate({ taskId: task.id })}
                        disabled={approveCompletion.isPending}
                        className="h-6 rounded-none bg-black text-white hover:bg-neutral-800 text-[8px] uppercase tracking-widest px-2 transition-none"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        APPROVE
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectModal({ open: true, taskId: task.id, taskTitle: task.title })}
                        className="h-6 rounded-none border-neutral-300 text-[8px] uppercase tracking-widest px-2 transition-none hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        REJECT
                      </Button>
                    </>
                  )}
                  {task.status === "review" && !isManager && isMyTask && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400">PENDING_REVIEW</span>
                    </div>
                  )}
                  {task.status === "done" && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-black" />
                      <span className="text-[8px] uppercase tracking-widest text-neutral-500">COMPLETED</span>
                    </div>
                  )}
                  {task.status === "blocked" && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-[8px] uppercase tracking-widest text-red-500">BLOCKED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      <Dialog open={rejectModal.open} onOpenChange={open => !open && setRejectModal({ open: false, taskId: "", taskTitle: "" })}>
        <DialogContent className="max-w-md rounded-none border-neutral-200 font-mono">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">Reject_Completion</DialogTitle>
            <div className="h-[1px] w-full bg-neutral-100" />
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{rejectModal.taskTitle}</p>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Rejection_Reason</Label>
              <Textarea
                placeholder="ENTER_REJECTION_REASON..."
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 min-h-[100px] text-[11px] uppercase tracking-widest"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col space-y-2 sm:space-x-0">
            <Button
              onClick={() => rejectCompletion.mutate({ taskId: rejectModal.taskId, note: rejectNote })}
              disabled={rejectCompletion.isPending}
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
            >
              {rejectCompletion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONFIRM_REJECTION"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setRejectModal({ open: false, taskId: "", taskTitle: "" })}
              className="w-full rounded-none text-[8px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none"
            >
              ABORT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
