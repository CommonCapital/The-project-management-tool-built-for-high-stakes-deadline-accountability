"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus, Loader2, Send, CheckCircle, XCircle, Paperclip, FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { SubmitCompletionModal } from "./SubmitCompletionModal";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COLUMNS = [
  { id: "todo", name: "QUEUE" },
  { id: "in_progress", name: "PROCESSING" },
  { id: "review", name: "VALIDATION" },
  { id: "done", name: "ARCHIVED" },
];

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-black text-white",
  high: "bg-neutral-800 text-white",
  medium: "bg-neutral-100 text-neutral-500",
  low: "bg-neutral-50 text-neutral-400",
};

interface CreateForm {
  title: string;
  description: string;
  assigneeId: string;
  priority: "urgent" | "high" | "medium" | "low";
  deadline: string;
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [submitModalTaskId, setSubmitModalTaskId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState<{ open: boolean; status: string }>({ open: false, status: "todo" });
  const [form, setForm] = useState<CreateForm>({ title: "", description: "", assigneeId: "", priority: "medium", deadline: "" });

  const { data: me } = trpc.users.me.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery();
  const { data: tasks = [], refetch } = trpc.tasks.list.useQuery({ projectId });
  const { data: attachments = [] } = trpc.tasks.getAttachments.useQuery(
    { taskId: selectedTask ?? "" },
    { enabled: !!selectedTask }
  );

  const isManager = me?.role === "admin" || me?.role === "manager";

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("TASK_CREATED");
      setCreateModal({ open: false, status: "todo" });
      setForm({ title: "", description: "", assigneeId: "", priority: "medium", deadline: "" });
      refetch();
    },
    onError: (e) => toast.error(e.message || "CREATE_FAILED"),
  });

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => { refetch(); },
  });

  const approveCompletion = trpc.tasks.approveCompletion.useMutation({
    onSuccess: () => { toast.success("TASK_APPROVED"); refetch(); setSelectedTask(null); },
    onError: (e) => toast.error(e.message),
  });

  const rejectCompletion = trpc.tasks.rejectCompletion.useMutation({
    onSuccess: () => { toast.success("TASK_SENT_BACK"); refetch(); setSelectedTask(null); },
    onError: (e) => toast.error(e.message),
  });

  const getUserName = (id: string | null) => {
    if (!id) return null;
    const u = users.find(u => u.id === id);
    return u?.name ?? null;
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const task = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

  return (
    <div className="flex h-full space-x-6 overflow-x-auto pb-8 font-mono">
      {COLUMNS.map(column => {
        const colTasks = tasks.filter(t => t.status === column.id);
        return (
          <div key={column.id} className="flex w-72 flex-shrink-0 flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-black pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">{column.name}</h3>
              <span className="text-[8px] text-neutral-400">{colTasks.length}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {colTasks.map(t => {
                const enriched = t as typeof t & { assigneeIds?: string[] };
                const jIds: string[] = enriched.assigneeIds ?? [];
                const assigneeIds: string[] = jIds.length > 0 ? jIds : (t.assigneeId ? [t.assigneeId] : []);
                const assigneeNames = assigneeIds.map(id => getUserName(id)).filter(Boolean) as string[];
                const isMyTask = !!(me?.id && (assigneeIds.includes(me.id) || t.assigneeId === me.id));
                return (
                  <div
                    key={t.id}
                    className="border border-neutral-100 bg-white p-4 space-y-3 hover:border-black transition-none cursor-pointer group"
                    onClick={() => setSelectedTask(t.id)}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn("text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5", PRIORITY_STYLES[t.priority])}>
                        {t.priority}
                      </span>
                      <MoreHorizontal className="h-3 w-3 text-neutral-200 group-hover:text-neutral-400" />
                    </div>

                    <h4 className="text-[11px] font-bold uppercase tracking-tight leading-tight group-hover:italic">
                      {t.title}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      {assigneeNames.length > 0 ? (
                        <div className="flex items-center -space-x-1">
                          {assigneeNames.slice(0, 3).map((name, i) => (
                            <div key={i} className="h-5 w-5 bg-black text-white flex items-center justify-center text-[7px] font-bold border border-white">
                              {getInitials(name)}
                            </div>
                          ))}
                          {assigneeNames.length > 3 && (
                            <div className="h-5 w-5 bg-neutral-200 text-neutral-600 flex items-center justify-center text-[6px] font-bold border border-white">
                              +{assigneeNames.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-5 w-5 border border-dashed border-neutral-200 flex items-center justify-center">
                          <span className="text-[7px] text-neutral-300">?</span>
                        </div>
                      )}
                      <span className="text-[8px] text-neutral-300 uppercase tracking-widest">
                        {t.deadline ? format(new Date(t.deadline), "MMM d") : "—"}
                      </span>
                    </div>

                    {isMyTask && t.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSubmitModalTaskId(t.id); }}
                        className="w-full h-6 rounded-none bg-black text-white hover:bg-neutral-800 text-[7px] uppercase tracking-widest transition-none"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        SUBMIT_FOR_REVIEW
                      </Button>
                    )}
                  </div>
                );
              })}

              {isManager && (
                <Button
                  variant="ghost"
                  onClick={() => setCreateModal({ open: true, status: column.id })}
                  className="w-full rounded-none border border-dashed border-neutral-200 text-[8px] uppercase tracking-widest py-5 text-neutral-300 hover:text-black hover:border-black transition-none"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  ADD_TASK
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Task detail panel */}
      {task && (() => {
        const enrichedTask = task as typeof task & { assigneeIds?: string[] };
        // Always merge junction-table ids with the legacy assigneeId column so old tasks still work
        const junctionIds: string[] = enrichedTask.assigneeIds ?? [];
        const taskAssigneeIds: string[] = junctionIds.length > 0
          ? junctionIds
          : (task.assigneeId ? [task.assigneeId] : []);
        const isMyTask = !!(me?.id && (taskAssigneeIds.includes(me.id) || task.assigneeId === me.id));
        const taskAssigneeNames = taskAssigneeIds.map(id => getUserName(id)).filter(Boolean) as string[];
        return (
          <>
            <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setSelectedTask(null)} />
            <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-neutral-100 z-50 flex flex-col font-mono shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold">Task_Detail</p>
                <button onClick={() => setSelectedTask(null)} className="text-[9px] text-neutral-400 hover:text-black uppercase tracking-widest">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <h2 className="text-sm font-bold uppercase tracking-tight">{task.title}</h2>
                {task.description && <p className="text-[10px] text-neutral-500">{task.description}</p>}
                <div className="grid grid-cols-2 gap-4 text-[9px]">
                  <div>
                    <p className="text-neutral-400 uppercase tracking-widest mb-1">Priority</p>
                    <span className={cn("px-2 py-1 font-bold uppercase", PRIORITY_STYLES[task.priority])}>{task.priority}</span>
                  </div>
                  <div>
                    <p className="text-neutral-400 uppercase tracking-widest mb-1">Status</p>
                    <span className="font-bold uppercase">{task.status.replace("_", " ")}</span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-neutral-400 uppercase tracking-widest mb-1">Assignees</p>
                    {taskAssigneeNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {taskAssigneeNames.map((name, i) => (
                          <span key={i} className="flex items-center space-x-1 bg-neutral-50 px-2 py-0.5">
                            <div className="h-4 w-4 bg-black text-white flex items-center justify-center text-[6px] font-bold">{getInitials(name)}</div>
                            <span className="text-[8px] uppercase">{name.split(" ")[0]}</span>
                          </span>
                        ))}
                      </div>
                    ) : <span className="font-bold uppercase text-neutral-300">Unassigned</span>}
                  </div>
                  <div>
                    <p className="text-neutral-400 uppercase tracking-widest mb-1">Deadline</p>
                    <span className="font-bold uppercase">{task.deadline ? format(new Date(task.deadline), "MMM d") : "—"}</span>
                  </div>
                </div>
                {/* Completion submission — show for review/done tasks */}
                {(task.status === "review" || task.status === "done") && (task.completionNote || attachments.length > 0) && (
                  <div className="space-y-3 border border-neutral-200 p-4 bg-neutral-50">
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-neutral-500">Submission_Details</p>

                    {task.completionNote && (
                      <div className="space-y-1">
                        <p className="text-[7px] uppercase tracking-widest text-neutral-400">Description</p>
                        <p className="text-[10px] text-neutral-700 leading-relaxed">{task.completionNote}</p>
                      </div>
                    )}

                    {attachments.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[7px] uppercase tracking-widest text-neutral-400">Attachments ({attachments.length})</p>
                        <div className="space-y-1">
                          {attachments.map(att => {
                            const ext = att.fileName.split(".").pop()?.toLowerCase() ?? "";
                            const isImage = ["png","jpg","jpeg","gif","webp","svg"].includes(ext);
                            const isSheet = ["xls","xlsx","csv"].includes(ext);
                            const Icon = isImage ? Image : isSheet ? FileSpreadsheet : ext === "pdf" ? FileText : File;
                            return (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 border border-neutral-200 bg-white px-3 py-2 hover:border-black transition-none group"
                              >
                                <Icon className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0 group-hover:text-black" />
                                <span className="text-[9px] uppercase truncate text-neutral-600 group-hover:text-black flex-1">{att.fileName}</span>
                                <span className="text-[7px] text-neutral-300 uppercase flex-shrink-0">{ext}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="border-t border-neutral-100 p-4 space-y-2">
                {/* Assignee: START when todo */}
                {isMyTask && task.status === "todo" && (
                  <Button
                    onClick={() => updateStatus.mutate({ taskId: task.id, status: "in_progress" })}
                    disabled={updateStatus.isPending}
                    className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none text-[9px] uppercase tracking-widest"
                  >
                    START_TASK
                  </Button>
                )}
                {/* Assignee: SUBMIT when in_progress */}
                {isMyTask && task.status === "in_progress" && (
                  <Button
                    onClick={() => setSubmitModalTaskId(task.id)}
                    className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none text-[9px] uppercase tracking-widest"
                  >
                    <Send className="h-3 w-3 mr-2" />
                    SUBMIT_FOR_REVIEW
                  </Button>
                )}
                {/* Assignee: view-only when in review */}
                {isMyTask && task.status === "review" && (
                  <div className="text-center py-1">
                    <p className="text-[8px] uppercase tracking-widest text-neutral-400">Awaiting_Manager_Review</p>
                  </div>
                )}
                {/* Manager: approve / reject */}
                {isManager && task.status === "review" && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => approveCompletion.mutate({ taskId: task.id })}
                      disabled={approveCompletion.isPending}
                      className="flex-1 rounded-none bg-black text-white hover:bg-neutral-800 transition-none text-[8px] uppercase tracking-widest"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      APPROVE
                    </Button>
                    <Button
                      onClick={() => rejectCompletion.mutate({ taskId: task.id })}
                      disabled={rejectCompletion.isPending}
                      variant="outline"
                      className="flex-1 rounded-none border-neutral-200 hover:border-black transition-none text-[8px] uppercase tracking-widest"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      REJECT
                    </Button>
                  </div>
                )}
                {/* Manager: full status override */}
                {isManager && task.status !== "review" && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(["todo", "in_progress", "blocked", "done"] as const)
                      .filter(s => s !== task.status)
                      .map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus.mutate({ taskId: task.id, status: s })}
                          disabled={updateStatus.isPending}
                          className="flex-1 border border-neutral-100 hover:border-black text-[7px] uppercase tracking-widest py-1.5 text-neutral-400 hover:text-black transition-none"
                        >
                          → {s.replace("_", " ")}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Submit completion modal — always mounted so it doesn't unmount mid-open */}
      <SubmitCompletionModal
        taskId={submitModalTaskId ?? ""}
        isOpen={!!submitModalTaskId}
        onClose={() => setSubmitModalTaskId(null)}
        onSuccess={() => { refetch(); setSelectedTask(null); }}
      />

      {/* Create Task Modal */}
      <Dialog open={createModal.open} onOpenChange={open => !open && setCreateModal({ open: false, status: "todo" })}>
        <DialogContent className="max-w-md rounded-none border-neutral-200 font-mono">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">
              Add_Task — {COLUMNS.find(c => c.id === createModal.status)?.name}
            </DialogTitle>
            <div className="h-[1px] w-full bg-neutral-100" />
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Title *</Label>
              <Input
                placeholder="TASK_TITLE..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 text-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Description</Label>
              <Textarea
                placeholder="BRIEF..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 min-h-[60px] text-[11px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Assignee</Label>
                <select
                  value={form.assigneeId}
                  onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                  className="w-full border border-neutral-200 px-2 py-2 text-[10px] bg-white focus:outline-none focus:border-black"
                >
                  <option value="">UNASSIGNED</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Priority</Label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as CreateForm["priority"] }))}
                  className="w-full border border-neutral-200 px-2 py-2 text-[10px] bg-white focus:outline-none focus:border-black"
                >
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="urgent">URGENT</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 text-[11px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col space-y-2 sm:space-x-0">
            <Button
              onClick={() => createTask.mutate({
                title: form.title,
                description: form.description || undefined,
                projectId,
                assigneeId: form.assigneeId || undefined,
                priority: form.priority,
                deadline: form.deadline ? new Date(form.deadline) : undefined,
              })}
              disabled={createTask.isPending || !form.title}
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
            >
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "CREATE_TASK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
