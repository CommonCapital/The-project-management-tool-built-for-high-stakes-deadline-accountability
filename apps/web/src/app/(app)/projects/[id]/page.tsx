"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { Loader2, CheckSquare, Info, Users, Settings, Plus, X, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isLoading, refetch: refetchProject } = trpc.projects.getById.useQuery({ id });
  const { data: stats } = trpc.projects.getStats.useQuery({ projectId: id });
  const { data: members = [], refetch: refetchMembers } = trpc.projects.getMembers.useQuery({ projectId: id });
  const { data: allUsers = [] } = trpc.users.list.useQuery();
  const { data: me } = trpc.users.me.useQuery();

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "archived" | "completed">("active");
  const [editInit, setEditInit] = useState(false);

  const isManager = me?.role === "admin" || me?.role === "manager";

  const addMember = trpc.projects.addMember.useMutation({
    onSuccess: () => { toast.success("MEMBER_ADDED"); refetchMembers(); },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.projects.removeMember.useMutation({
    onSuccess: () => { toast.success("MEMBER_REMOVED"); refetchMembers(); },
    onError: (e) => toast.error(e.message),
  });

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("SAVED"); refetchProject(); },
    onError: (e) => toast.error(e.message),
  });

  const nonMembers = allUsers.filter(u => !members.find(m => m.id === u.id));

  const statsChartData = stats ? [
    { name: "TODO", value: Number(stats.total) - Number(stats.done) - Number(stats.inProgress) - Number(stats.review) },
    { name: "IN PROGRESS", value: Number(stats.inProgress) },
    { name: "REVIEW", value: Number(stats.review) },
    { name: "DONE", value: Number(stats.done) },
  ] : [];

  const completionRate = stats && Number(stats.total) > 0
    ? Math.round((Number(stats.done) / Number(stats.total)) * 100)
    : 0;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!project) return <div className="font-mono text-[10px] uppercase p-8">Entity_Not_Found</div>;

  return (
    <div className="flex flex-col h-full space-y-6 font-mono">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/projects" className="inline-flex items-center text-[9px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none">
          <ArrowLeft className="h-3 w-3 mr-1" /> All_Projects
        </Link>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Project // {project.id.slice(0, 8)}</h2>
            <h1 className="text-3xl font-bold tracking-tighter uppercase italic">{project.name}</h1>
            {project.description && <p className="text-[10px] text-neutral-400 max-w-lg">{project.description}</p>}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[7px] uppercase tracking-widest text-neutral-300">Completion</p>
              <p className="text-xl font-bold">{completionRate}%</p>
            </div>
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-widest px-3 py-1.5",
              project.status === "active" ? "bg-black text-white" :
              project.status === "completed" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-500"
            )}>
              {project.status}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-neutral-100" />

      <Tabs defaultValue="board" className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-neutral-100 h-auto p-0 space-x-6">
          {[
            { value: "board", label: "OPERATIONAL_BOARD", icon: CheckSquare },
            { value: "overview", label: "INTELLIGENCE_OVERVIEW", icon: Info },
            { value: "roster", label: "PERSONNEL_ROSTER", icon: Users },
            { value: "config", label: "CONFIGURATION", icon: Settings },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-3.5 text-[9px] font-bold uppercase tracking-widest transition-none text-neutral-400 data-[state=active]:text-black"
            >
              <tab.icon className="mr-2 h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OPERATIONAL_BOARD — Kanban */}
        <TabsContent value="board" className="flex-1 pt-6 outline-none min-h-0 overflow-hidden">
          <KanbanBoard projectId={project.id} />
        </TabsContent>

        {/* INTELLIGENCE_OVERVIEW — Stats */}
        <TabsContent value="overview" className="flex-1 pt-6 outline-none overflow-y-auto">
          <div className="space-y-8 max-w-3xl">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total_Tasks", value: Number(stats?.total ?? 0) },
                { label: "Completed", value: Number(stats?.done ?? 0) },
                { label: "In_Review", value: Number(stats?.review ?? 0) },
                { label: "Overdue", value: Number(stats?.overdue ?? 0), danger: true },
              ].map(s => (
                <div key={s.label} className={cn("border border-neutral-100 p-5 space-y-2", s.danger && Number(s.value) > 0 && "border-neutral-400")}>
                  <p className="text-[8px] uppercase tracking-widest text-neutral-400">{s.label}</p>
                  <p className="text-3xl font-bold tracking-tighter">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Completion bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] uppercase tracking-widest text-neutral-400">
                <span>Completion_Progress</span>
                <span>{completionRate}%</span>
              </div>
              <div className="h-2 bg-neutral-100 w-full">
                <div className="h-2 bg-black transition-all" style={{ width: `${completionRate}%` }} />
              </div>
            </div>

            {/* Status chart */}
            {Number(stats?.total ?? 0) > 0 && (
              <div className="space-y-3">
                <p className="text-[8px] uppercase tracking-widest text-neutral-400">Task_Distribution</p>
                <div className="border border-neutral-100 p-4" style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsChartData} barSize={32}>
                      <XAxis dataKey="name" tick={{ fontSize: 7, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontFamily: "monospace", fontSize: 9, borderRadius: 0, border: "1px solid #e5e5e5" }} cursor={{ fill: "#f5f5f5" }} />
                      <Bar dataKey="value" fill="#000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Project meta */}
            <div className="grid grid-cols-2 gap-4 text-[9px]">
              {project.deadline && (
                <div className="border border-neutral-100 p-4">
                  <p className="text-neutral-400 uppercase tracking-widest mb-1">Deadline</p>
                  <p className="font-bold uppercase">{format(new Date(project.deadline), "MMM d, yyyy")}</p>
                </div>
              )}
              <div className="border border-neutral-100 p-4">
                <p className="text-neutral-400 uppercase tracking-widest mb-1">Team_Size</p>
                <p className="font-bold">{members.length} members</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PERSONNEL_ROSTER — Member management */}
        <TabsContent value="roster" className="flex-1 pt-6 outline-none overflow-y-auto">
          <div className="max-w-2xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Project_Members ({members.length})</h3>
            </div>

            {/* Current members */}
            <div className="border border-neutral-100">
              {members.length === 0 ? (
                <div className="p-8 text-center text-[9px] uppercase tracking-widest text-neutral-300">No_Members_Assigned</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="px-5 py-3 text-[7px] font-bold uppercase tracking-widest">Name</th>
                      <th className="px-5 py-3 text-[7px] font-bold uppercase tracking-widest">Role</th>
                      <th className="px-5 py-3 text-[7px] font-bold uppercase tracking-widest">Position</th>
                      <th className="px-5 py-3 text-[7px] font-bold uppercase tracking-widest">Added</th>
                      {isManager && <th className="px-5 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-7 w-7 bg-black text-white flex items-center justify-center text-[7px] font-bold">
                              {m.name?.slice(0, 2).toUpperCase() ?? "??"}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[7px] uppercase tracking-widest px-1.5 py-0.5 bg-neutral-100">{m.role ?? "member"}</span>
                        </td>
                        <td className="px-5 py-3 text-[9px] text-neutral-400">{(m as Record<string, unknown>).position as string ?? "—"}</td>
                        <td className="px-5 py-3 text-[8px] text-neutral-400">
                          {m.joinedAt ? format(new Date(m.joinedAt), "MMM d") : "—"}
                        </td>
                        {isManager && (
                          <td className="px-5 py-3">
                            <button
                              onClick={() => removeMember.mutate({ projectId: id, userId: m.id })}
                              className="text-neutral-300 hover:text-black transition-none"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Add member */}
            {isManager && nonMembers.length > 0 && (
              <div className="space-y-3">
                <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-400">Add_Personnel</p>
                <div className="grid grid-cols-2 gap-2">
                  {nonMembers.map(u => (
                    <div key={u.id} className="flex items-center justify-between border border-neutral-100 px-4 py-3 hover:border-neutral-300">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-neutral-100 flex items-center justify-center text-[7px] font-bold">
                          {u.name?.slice(0, 2).toUpperCase() ?? "??"}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase">{u.name}</p>
                          <p className="text-[7px] text-neutral-400 uppercase">{u.role ?? "member"}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addMember.mutate({ projectId: id, userId: u.id })}
                        disabled={addMember.isPending}
                        className="rounded-none border border-neutral-200 hover:border-black text-[7px] uppercase tracking-widest h-6 px-2 transition-none"
                      >
                        <Plus className="h-2.5 w-2.5 mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* CONFIGURATION — Project settings */}
        <TabsContent value="config" className="flex-1 pt-6 outline-none overflow-y-auto">
          <div className="max-w-lg space-y-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Project_Configuration</h3>

            {!editInit && (
              <Button
                onClick={() => {
                  setEditName(project.name);
                  setEditDesc(project.description ?? "");
                  setEditStatus(project.status as typeof editStatus);
                  setEditInit(true);
                }}
                className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none text-[9px] uppercase tracking-widest py-5 px-8"
              >
                Edit_Settings
              </Button>
            )}

            {editInit && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Project_Name</Label>
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0 text-[13px] font-bold uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Description</Label>
                  <Textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    rows={3}
                    className="rounded-none border border-neutral-200 bg-transparent focus-visible:border-black focus-visible:ring-0 text-[11px] resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Status</Label>
                  <div className="flex space-x-2">
                    {(["active", "completed", "archived"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={cn(
                          "px-4 py-2 text-[8px] uppercase tracking-widest border transition-none",
                          editStatus === s ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-400 hover:border-black"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => updateProject.mutate({ projectId: id, name: editName, description: editDesc, status: editStatus })}
                    disabled={updateProject.isPending}
                    className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none text-[9px] uppercase tracking-widest py-5 px-8"
                  >
                    {updateProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SAVE_CHANGES"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setEditInit(false)}
                    className="rounded-none border border-neutral-200 hover:border-black transition-none text-[9px] uppercase tracking-widest py-5 px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
