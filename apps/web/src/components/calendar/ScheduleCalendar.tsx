"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, differenceInMinutes, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, X, Users, User, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const HOUR_START = 7;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const CELL_H = 64; // px per hour
const GRID_H = TOTAL_HOURS * CELL_H;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-black text-white border-black",
  high: "bg-neutral-800 text-white border-neutral-800",
  medium: "bg-neutral-200 text-neutral-800 border-neutral-300",
  low: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

interface DragState {
  dayIndex: number;
  startMinute: number; // minutes from HOUR_START
  currentMinute: number;
}

interface ModalState {
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}

function minuteToY(minute: number) {
  return (minute / 60) * CELL_H;
}

function yToMinute(y: number, clamp = true) {
  const raw = (y / CELL_H) * 60;
  const snapped = Math.round(raw / 15) * 15;
  if (!clamp) return snapped;
  return Math.max(0, Math.min(TOTAL_HOURS * 60 - 15, snapped));
}

function formatMinute(m: number) {
  const h = HOUR_START + Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${min.toString().padStart(2, "0")}${period}`;
}

function minuteToDate(base: Date, minute: number): Date {
  const d = new Date(base);
  d.setHours(HOUR_START + Math.floor(minute / 60), minute % 60, 0, 0);
  return d;
}

function dateToMinute(date: Date): number {
  return (date.getHours() - HOUR_START) * 60 + date.getMinutes();
}

export function ScheduleCalendar() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 7);

  const { data: me } = trpc.users.me.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: calTasks = [], refetch } = trpc.tasks.listForCalendar.useQuery({
    start: weekStart,
    end: weekEnd,
  });

  const isManager = me?.role === "admin" || me?.role === "manager";

  // Drag state
  const [drag, setDrag] = useState<DragState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Create form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "medium" as "urgent" | "high" | "medium" | "low",
    isCommon: false,
    assigneeId: "",
  });

  // Selected task for detail panel
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const createScheduled = trpc.tasks.createScheduled.useMutation({
    onSuccess: () => {
      toast.success("SCHEDULED");
      setModal(null);
      setForm({ title: "", description: "", projectId: "", priority: "medium", isCommon: false, assigneeId: "" });
      refetch();
    },
    onError: (e) => toast.error(e.message || "FAILED"),
  });

  const deleteScheduled = trpc.tasks.deleteScheduled.useMutation({
    onSuccess: () => { toast.success("DELETED"); setSelectedTask(null); refetch(); },
  });

  // ─── Drag handlers ───────────────────────────────────────────────────────
  const getMinuteFromPointer = useCallback((dayIndex: number, clientY: number) => {
    const col = columnRefs.current[dayIndex];
    if (!col) return 0;
    const rect = col.getBoundingClientRect();
    const y = clientY - rect.top;
    return yToMinute(y);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, dayIndex: number) => {
    if (!isManager) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const minute = getMinuteFromPointer(dayIndex, e.clientY);
    setDrag({ dayIndex, startMinute: minute, currentMinute: minute });
  }, [isManager, getMinuteFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent, dayIndex: number) => {
    if (!drag || drag.dayIndex !== dayIndex) return;
    const minute = getMinuteFromPointer(dayIndex, e.clientY);
    setDrag(d => d ? { ...d, currentMinute: minute } : null);
  }, [drag, getMinuteFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent, dayIndex: number) => {
    if (!drag || drag.dayIndex !== dayIndex) return;
    const endMinute = getMinuteFromPointer(dayIndex, e.clientY);
    const start = Math.min(drag.startMinute, endMinute);
    const end = Math.max(drag.startMinute, endMinute);
    setDrag(null);
    // Only open modal if meaningful drag (at least 15 min)
    if (end - start >= 15) {
      setModal({ dayIndex, startMinute: start, endMinute: end });
    }
  }, [drag, getMinuteFromPointer]);

  // ─── Render tasks ─────────────────────────────────────────────────────────
  const getTasksForDay = (day: Date) =>
    calTasks.filter(t => t.scheduledStart && isSameDay(new Date(t.scheduledStart), day));

  const selectedTaskData = calTasks.find(t => t.id === selectedTask);

  const handleCreateSubmit = () => {
    if (!modal || !form.title || !form.projectId) return;
    const day = days[modal.dayIndex];
    createScheduled.mutate({
      title: form.title,
      description: form.description || undefined,
      projectId: form.projectId,
      priority: form.priority,
      isCommon: form.isCommon,
      assigneeId: form.isCommon ? undefined : (form.assigneeId || undefined),
      scheduledStart: minuteToDate(day, modal.startMinute),
      scheduledEnd: minuteToDate(day, modal.endMinute),
    });
  };

  const today = new Date();

  return (
    <div className="flex h-full flex-col font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 03</h2>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Work_Schedule</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(w => subWeeks(w, 1))}
            className="rounded-none border border-neutral-200 hover:border-black transition-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[10px] uppercase tracking-widest text-neutral-600 min-w-[180px] text-center">
            {format(weekStart, "MMM d")} — {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="rounded-none border border-neutral-200 hover:border-black transition-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-none border border-neutral-200 hover:border-black text-[9px] uppercase tracking-widest transition-none px-4"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-neutral-100 mb-4" />

      {isManager && (
        <p className="text-[8px] uppercase tracking-widest text-neutral-300 mb-3">
          Drag on any day column to schedule work
        </p>
      )}

      {/* Calendar grid */}
      <div className="flex flex-1 overflow-hidden border border-neutral-100">
        {/* Time gutter */}
        <div className="flex-shrink-0 w-14 border-r border-neutral-100 bg-white">
          {/* Header spacer */}
          <div className="h-12 border-b border-neutral-100" />
          <div className="relative" style={{ height: GRID_H }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[8px] text-neutral-300 uppercase tracking-widest"
                style={{ top: (h - HOUR_START) * CELL_H - 6 }}
              >
                {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex flex-1 overflow-x-auto overflow-y-auto">
          <div className="flex min-w-full">
            {days.map((day, di) => {
              const isToday = isSameDay(day, today);
              const dayTasks = getTasksForDay(day);
              const isDraggingHere = drag?.dayIndex === di;
              const dragTop = drag ? minuteToY(Math.min(drag.startMinute, drag.currentMinute)) : 0;
              const dragH = drag ? Math.abs(drag.currentMinute - drag.startMinute) / 60 * CELL_H : 0;

              return (
                <div key={di} className="flex-1 min-w-[120px] border-r border-neutral-100 last:border-r-0">
                  {/* Day header */}
                  <div className={cn(
                    "h-12 border-b border-neutral-100 flex flex-col items-center justify-center sticky top-0 bg-white z-10",
                    isToday && "bg-black text-white"
                  )}>
                    <span className={cn("text-[7px] uppercase tracking-widest", isToday ? "text-neutral-300" : "text-neutral-400")}>
                      {format(day, "EEE")}
                    </span>
                    <span className={cn("text-sm font-bold", isToday ? "text-white" : "text-black")}>
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Time grid */}
                  <div
                    ref={el => { columnRefs.current[di] = el; }}
                    className="relative"
                    style={{ height: GRID_H, cursor: isManager ? "crosshair" : "default" }}
                    onPointerDown={e => handlePointerDown(e, di)}
                    onPointerMove={e => handlePointerMove(e, di)}
                    onPointerUp={e => handlePointerUp(e, di)}
                  >
                    {/* Hour lines */}
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-neutral-50"
                        style={{ top: (h - HOUR_START) * CELL_H }}
                      />
                    ))}
                    {/* Half-hour lines */}
                    {HOURS.slice(0, -1).map(h => (
                      <div
                        key={`${h}h`}
                        className="absolute left-0 right-0 border-t border-dashed border-neutral-50"
                        style={{ top: (h - HOUR_START) * CELL_H + CELL_H / 2 }}
                      />
                    ))}

                    {/* Ghost drag block */}
                    {isDraggingHere && dragH > 4 && (
                      <div
                        className="absolute left-1 right-1 bg-black/10 border border-black/30 border-dashed z-10 pointer-events-none flex items-start p-1"
                        style={{ top: dragTop, height: Math.max(dragH, 8) }}
                      >
                        <span className="text-[7px] text-black/60 uppercase tracking-widest">
                          {formatMinute(Math.min(drag!.startMinute, drag!.currentMinute))}
                          {" → "}
                          {formatMinute(Math.max(drag!.startMinute, drag!.currentMinute))}
                        </span>
                      </div>
                    )}

                    {/* Task blocks */}
                    {dayTasks.map(t => {
                      const startM = t.scheduledStart ? dateToMinute(new Date(t.scheduledStart)) : 0;
                      const endM = t.scheduledEnd ? dateToMinute(new Date(t.scheduledEnd)) : startM + 60;
                      const top = minuteToY(Math.max(0, startM));
                      const height = Math.max(minuteToY(endM - startM), 20);
                      const assignee = users.find(u => u.id === t.assigneeId);

                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-none border-l-2 px-1.5 py-1 overflow-hidden cursor-pointer z-20 hover:opacity-80 transition-none",
                            PRIORITY_COLORS[t.priority],
                            selectedTask === t.id && "ring-2 ring-black ring-offset-1"
                          )}
                          style={{ top, height }}
                          onClick={e => { e.stopPropagation(); setSelectedTask(t.id); }}
                        >
                          <p className="text-[7px] font-bold uppercase truncate leading-tight">{t.title}</p>
                          {height > 28 && (
                            <p className="text-[6px] opacity-70 uppercase truncate">
                              {t.isCommon ? (
                                <span className="flex items-center gap-0.5"><Users className="h-2 w-2 inline" /> COMMON</span>
                              ) : (
                                assignee?.name?.split(" ")[0] ?? "Unassigned"
                              )}
                            </p>
                          )}
                          {height > 40 && (
                            <p className="text-[6px] opacity-50 uppercase">
                              {formatMinute(startM)} → {formatMinute(endM)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task detail side panel */}
      {selectedTask && selectedTaskData && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSelectedTask(null)} />
          <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-neutral-100 z-50 flex flex-col shadow-xl font-mono">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold">Task_Detail</p>
              <button onClick={() => setSelectedTask(null)} className="text-neutral-400 hover:text-black text-[10px]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-tight">{selectedTaskData.title}</h2>
              {selectedTaskData.description && (
                <p className="text-[10px] text-neutral-500">{selectedTaskData.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-[9px]">
                <div>
                  <p className="text-neutral-400 uppercase tracking-widest mb-1">Assignee</p>
                  <p className="font-bold uppercase flex items-center gap-1">
                    {selectedTaskData.isCommon ? (
                      <><Users className="h-3 w-3" /> COMMON</>
                    ) : (
                      <><User className="h-3 w-3" />{users.find(u => u.id === selectedTaskData.assigneeId)?.name ?? "—"}</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400 uppercase tracking-widest mb-1">Priority</p>
                  <span className={cn("text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5", PRIORITY_COLORS[selectedTaskData.priority])}>
                    {selectedTaskData.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-400 uppercase tracking-widest mb-1">Time</p>
                  <p className="font-bold">
                    {selectedTaskData.scheduledStart && format(new Date(selectedTaskData.scheduledStart), "EEE MMM d, h:mma")}
                    {" → "}
                    {selectedTaskData.scheduledEnd && format(new Date(selectedTaskData.scheduledEnd), "h:mma")}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="font-bold uppercase">{selectedTaskData.status.replace("_", " ")}</p>
                </div>
              </div>
            </div>
            {isManager && (
              <div className="border-t border-neutral-100 p-4">
                <Button
                  variant="ghost"
                  onClick={() => deleteScheduled.mutate({ taskId: selectedTaskData.id })}
                  disabled={deleteScheduled.isPending}
                  className="w-full rounded-none border border-neutral-200 hover:border-black text-[9px] uppercase tracking-widest transition-none"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  {deleteScheduled.isPending ? "Deleting..." : "DELETE_BLOCK"}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="max-w-md rounded-none border-neutral-200 font-mono">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">
              Schedule_Work
            </DialogTitle>
            <div className="h-[1px] w-full bg-neutral-100" />
          </DialogHeader>

          {modal && (
            <div className="text-[9px] uppercase tracking-widest text-neutral-400 mb-2">
              {days[modal.dayIndex] && format(days[modal.dayIndex], "EEEE, MMMM d")}
              {" · "}
              {formatMinute(modal.startMinute)} → {formatMinute(modal.endMinute)}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Title *</Label>
              <Input
                placeholder="WORK_TITLE..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Description</Label>
              <Textarea
                placeholder="DETAILS..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 min-h-[60px] text-[11px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Project *</Label>
              <select
                value={form.projectId}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                className="w-full border border-neutral-200 px-2 py-2 text-[10px] bg-white focus:outline-none focus:border-black"
              >
                <option value="">SELECT_PROJECT</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Priority</Label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as typeof form.priority }))}
                className="w-full border border-neutral-200 px-2 py-2 text-[10px] bg-white focus:outline-none focus:border-black"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
                <option value="urgent">URGENT</option>
              </select>
            </div>

            {/* Assignee toggle */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Audience</Label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isCommon: true, assigneeId: "" }))}
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-2 border text-[9px] uppercase tracking-widest transition-none",
                    form.isCommon ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-400 hover:border-black"
                  )}
                >
                  <Users className="h-3 w-3" />
                  <span>Common (All)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isCommon: false }))}
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-2 border text-[9px] uppercase tracking-widest transition-none",
                    !form.isCommon ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-400 hover:border-black"
                  )}
                >
                  <User className="h-3 w-3" />
                  <span>Specific</span>
                </button>
              </div>
              {!form.isCommon && (
                <select
                  value={form.assigneeId}
                  onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                  className="w-full border border-neutral-200 px-2 py-2 text-[10px] bg-white focus:outline-none focus:border-black mt-1"
                >
                  <option value="">SELECT_PERSON</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCreateSubmit}
              disabled={createScheduled.isPending || !form.title || !form.projectId}
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
            >
              {createScheduled.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SCHEDULE_WORK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
