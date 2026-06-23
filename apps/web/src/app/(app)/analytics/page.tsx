"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, PieChart as PieIcon, AlertCircle, CheckCircle2, Users, Briefcase } from "lucide-react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#000000", "#404040", "#737373", "#a3a3a3", "#e5e5e5"];

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getOrgStats.useQuery();
  const { data: dailyData, isLoading: dailyLoading } = trpc.analytics.getTasksCreatedPerDay.useQuery();
  const { data: distribution, isLoading: distLoading } = trpc.analytics.getTaskStatusDistribution.useQuery();
  const { data: health, isLoading: healthLoading } = trpc.analytics.getWorkspaceHealth.useQuery();

  const isLoading = statsLoading || dailyLoading || distLoading || healthLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const completionRate = stats?.tasks.total
    ? Math.round((Number(stats.tasks.completed) / Number(stats.tasks.total)) * 100)
    : 0;

  return (
    <div className="space-y-12 font-mono">
      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 04</h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Institutional_Intelligence</h1>
        <div className="h-[1px] w-full bg-neutral-100" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <div className="border border-neutral-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Total_Tasks</span>
            <CheckCircle2 className="h-4 w-4 text-neutral-200" />
          </div>
          <p className="text-3xl font-bold tracking-tighter">{Number(stats?.tasks.total ?? 0)}</p>
        </div>
        <div className="border border-black bg-black text-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Overdue</span>
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
          <p className="text-3xl font-bold tracking-tighter">{Number(stats?.tasks.overdue ?? 0)}</p>
        </div>
        <div className="border border-neutral-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Completion_%</span>
            <TrendingUp className="h-4 w-4 text-neutral-200" />
          </div>
          <p className="text-3xl font-bold tracking-tighter">{completionRate}%</p>
        </div>
        <div className="border border-neutral-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Personnel</span>
            <Users className="h-4 w-4 text-neutral-200" />
          </div>
          <p className="text-3xl font-bold tracking-tighter">{Number(stats?.users ?? 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Daily activity chart */}
        <div className="border border-neutral-100 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Operational_Velocity</h3>
            <TrendingUp className="h-4 w-4 text-neutral-300" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={dailyData ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fontFamily: "monospace", fill: "#a3a3a3" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fontFamily: "monospace", fill: "#a3a3a3" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: 0 }}
                  itemStyle={{ color: "#fff", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase" }}
                />
                <Bar dataKey="created" name="CREATED" fill="#d4d4d4" radius={0} />
                <Bar dataKey="completed" name="COMPLETED" fill="#000" radius={0} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-6 bg-neutral-300" />
              <span className="text-[8px] uppercase tracking-widest text-neutral-400">Created</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-6 bg-black" />
              <span className="text-[8px] uppercase tracking-widest text-neutral-400">Completed</span>
            </div>
          </div>
        </div>

        {/* Status distribution */}
        <div className="border border-neutral-100 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">State_Distribution</h3>
            <PieIcon className="h-4 w-4 text-neutral-300" />
          </div>
          {(distribution?.length ?? 0) > 0 ? (
            <div className="flex items-center gap-8">
              <div className="h-48 w-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={distribution}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {distribution?.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: 0 }}
                      itemStyle={{ color: "#fff", fontSize: 10, fontFamily: "monospace" }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {distribution?.map((d, i) => (
                  <div key={d.name} className="flex items-center space-x-3">
                    <div className="h-2 w-2 flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500">{d.name}</span>
                    <span className="text-[9px] font-bold text-black ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-[10px] uppercase tracking-widest text-neutral-300">NO_DATA_YET</p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="border border-neutral-100 p-6 space-y-2">
          <span className="text-[8px] uppercase tracking-widest text-neutral-300">Active_Projects</span>
          <p className="text-2xl font-bold tracking-tighter italic">{Number(stats?.projects ?? 0)}</p>
        </div>
        <div className="border border-neutral-100 p-6 space-y-2">
          <span className="text-[8px] uppercase tracking-widest text-neutral-300">Pending_Review</span>
          <p className="text-2xl font-bold tracking-tighter italic">{Number(stats?.tasks.inReview ?? 0)}</p>
        </div>
        <div className="border border-black bg-black text-white p-6 space-y-2">
          <span className="text-[8px] uppercase tracking-widest text-neutral-400">Risk_Level</span>
          <p className="text-2xl font-bold tracking-tighter italic">
            {Number(stats?.tasks.overdue ?? 0) === 0 ? "LOW" : Number(stats?.tasks.overdue ?? 0) < 5 ? "MEDIUM" : "HIGH"}
          </p>
        </div>
      </div>

      {/* Workspace health — per project */}
      {health && health.projects.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Project_Health_Matrix</h3>
            <div className="flex items-center space-x-2">
              <span className="text-[8px] uppercase tracking-widest text-neutral-400">Workspace_Health:</span>
              <span className="text-[10px] font-bold text-black">{health.healthScore}%</span>
            </div>
          </div>
          <div className="border border-neutral-100">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Project</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Tasks</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Done</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Overdue</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Completion_%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {health.projects.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3 text-[10px] font-bold uppercase tracking-tight">{p.name}</td>
                    <td className="px-6 py-3">
                      <span className="text-[7px] uppercase tracking-widest px-2 py-1 bg-neutral-100">—</span>
                    </td>
                    <td className="px-6 py-3 text-[10px]">{p.total}</td>
                    <td className="px-6 py-3 text-[10px]">{p.done}</td>
                    <td className="px-6 py-3 text-[10px]">
                      {p.overdue > 0 ? (
                        <span className="text-neutral-500 font-bold">{p.overdue}</span>
                      ) : (
                        <span className="text-neutral-300">0</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 h-1 bg-neutral-100 max-w-[80px]">
                          <div className="h-1 bg-black" style={{ width: `${p.completionRate}%` }} />
                        </div>
                        <span className="text-[9px] font-bold">{p.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
