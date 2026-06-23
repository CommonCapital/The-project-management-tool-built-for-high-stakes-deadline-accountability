"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar,
} from "recharts";

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-black text-white",
  high: "bg-neutral-800 text-white",
  medium: "bg-neutral-100 text-neutral-600",
  low: "bg-neutral-50 text-neutral-400",
};

const STATUS_STYLES: Record<string, string> = {
  done: "text-black",
  in_progress: "text-neutral-600",
  todo: "text-neutral-400",
  review: "text-neutral-500",
};

function KPIGauge({ score }: { score: number }) {
  const data = [{ name: "KPI", value: score, fill: score >= 80 ? "#000" : score >= 50 ? "#525252" : "#d4d4d4" }];
  return (
    <div className="relative flex items-center justify-center">
      <RadialBarChart
        width={160} height={160}
        cx={80} cy={80}
        innerRadius={55} outerRadius={75}
        barSize={12}
        data={data}
        startAngle={90} endAngle={-270}
      >
        <RadialBar dataKey="value" background={{ fill: "#f5f5f5" }} />
      </RadialBarChart>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[8px] uppercase tracking-widest text-neutral-400">KPI</span>
      </div>
    </div>
  );
}

export default function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);

  const { data: profile, isLoading: loadingProfile } = trpc.users.getById.useQuery({ userId });
  const { data: kpi, isLoading: loadingKPI } = trpc.analytics.getUserKPI.useQuery({ userId });
  const { data: taskBreakdown = [], isLoading: loadingTasks } = trpc.analytics.getUserTaskBreakdown.useQuery({ userId });

  if (loadingProfile || loadingKPI || loadingTasks) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 font-mono text-[10px] uppercase text-neutral-400">User_Not_Found</div>;
  }

  const skills: string[] = profile.skills ? JSON.parse(profile.skills) : [];

  const doneTasks = taskBreakdown.filter(t => t.status === "done");
  const notDoneTasks = taskBreakdown.filter(t => t.status !== "done" && t.status !== "review");
  const missedTasks = doneTasks.filter(t => {
    if (!t.deadline || !t.completedAt) return false;
    return new Date(t.completedAt) > new Date(t.deadline);
  });
  const reviewTasks = taskBreakdown.filter(t => t.status === "review");

  const priorityChartData = kpi?.byPriority.map(p => ({
    name: p.priority.toUpperCase(),
    total: p.total,
    done: p.completed,
  })) ?? [];

  return (
    <div className="space-y-10 font-mono max-w-4xl">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-[9px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none"
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Back_to_Personnel
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="h-16 w-16 bg-black text-white flex items-center justify-center text-xl font-bold">
              {profile.name?.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tighter uppercase italic">{profile.name}</h1>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">{profile.position ?? "No_Position_Set"}</p>
              <p className="text-[9px] text-neutral-400">{profile.email}</p>
            </div>
          </div>
          <span className={cn("text-[8px] font-bold uppercase tracking-widest px-3 py-1.5",
            profile.role === "admin" ? "bg-black text-white" :
            profile.role === "manager" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600"
          )}>
            {profile.role ?? "MEMBER"}
          </span>
        </div>
      </div>

      <div className="h-[1px] w-full bg-neutral-100" />

      {/* Bio + Skills */}
      {(profile.bio || skills.length > 0 || profile.cvUrl) && (
        <div className="grid grid-cols-2 gap-8">
          {profile.bio && (
            <div className="space-y-2">
              <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-400">Background</p>
              <p className="text-[10px] text-neutral-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}
          <div className="space-y-4">
            {skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="text-[8px] uppercase tracking-widest px-2 py-1 border border-neutral-200">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.cvUrl && (
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-400">CV / Resume</p>
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] uppercase tracking-widest text-black border-b border-black hover:border-neutral-400 hover:text-neutral-600 transition-none"
                >
                  View_Document ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI + Stats grid */}
      {kpi && (
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 border border-neutral-100 p-6 flex flex-col items-center justify-center">
            <KPIGauge score={kpi.kpi} />
          </div>
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {[
              { label: "Completion_Rate", value: `${kpi.completionRate}%`, icon: TrendingUp, color: "text-black" },
              { label: "On_Time_Rate", value: `${kpi.onTimeRate}%`, icon: Clock, color: kpi.onTimeRate >= 70 ? "text-black" : "text-neutral-400" },
              { label: "Total_Tasks", value: kpi.total, icon: CheckCircle, color: "text-black" },
              { label: "Completed", value: kpi.completed, icon: CheckCircle, color: "text-black" },
              { label: "On_Time", value: kpi.onTime, icon: CheckCircle, color: "text-black" },
              { label: "Missed_Deadline", value: kpi.missed, icon: XCircle, color: kpi.missed > 0 ? "text-neutral-500" : "text-neutral-300" },
            ].map(stat => (
              <div key={stat.label} className="border border-neutral-100 p-4 space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-neutral-400">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority breakdown chart */}
      {priorityChartData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Task_Completion_by_Priority</h3>
          <div className="border border-neutral-100 p-6" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontFamily: "monospace", fontSize: 9, border: "1px solid #e5e5e5", borderRadius: 0 }}
                  cursor={{ fill: "#f5f5f5" }}
                />
                <Bar dataKey="total" fill="#e5e5e5" name="Total" />
                <Bar dataKey="done" fill="#000" name="Done" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Task breakdown */}
      <div className="space-y-6">
        {[
          { label: "Done", tasks: doneTasks, count: doneTasks.length },
          { label: "In_Review", tasks: reviewTasks, count: reviewTasks.length },
          { label: "Done_Missed_Deadline", tasks: missedTasks, count: missedTasks.length },
          { label: "Not_Done", tasks: notDoneTasks, count: notDoneTasks.length },
        ].filter(g => g.count > 0).map(group => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
              {group.label} <span className="text-neutral-300">({group.count})</span>
            </h3>
            <div className="border border-neutral-100">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-4 py-3 text-[7px] font-bold uppercase tracking-widest">Task</th>
                    <th className="px-4 py-3 text-[7px] font-bold uppercase tracking-widest">Priority</th>
                    <th className="px-4 py-3 text-[7px] font-bold uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-[7px] font-bold uppercase tracking-widest">Deadline</th>
                    {group.label === "Done_Missed_Deadline" && (
                      <th className="px-4 py-3 text-[7px] font-bold uppercase tracking-widest">Completed</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {group.tasks.map(t => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-tight">{t.title}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5", PRIORITY_STYLES[t.priority])}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[9px] font-bold uppercase">
                        <span className={STATUS_STYLES[t.status]}>{t.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-[9px] text-neutral-400">
                        {t.deadline ? format(new Date(t.deadline), "MMM d, yyyy") : "—"}
                      </td>
                      {group.label === "Done_Missed_Deadline" && (
                        <td className="px-4 py-3 text-[9px] text-neutral-400">
                          {t.completedAt ? format(new Date(t.completedAt), "MMM d, yyyy") : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {taskBreakdown.length === 0 && (
          <div className="border border-neutral-100 p-8 text-center">
            <p className="text-[9px] uppercase tracking-widest text-neutral-300">No_Tasks_Assigned</p>
          </div>
        )}
      </div>
    </div>
  );
}
