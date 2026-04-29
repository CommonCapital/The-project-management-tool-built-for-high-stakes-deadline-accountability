"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, BarChart, PieChart, Activity } from "lucide-react";
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
  Cell
} from "recharts";

const COLORS = ["#000000", "#404040", "#737373", "#a3a3a3", "#e5e5e5"];

export default function AnalyticsPage() {
  const { data: stats, isLoading } = trpc.analytics.getOrgStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const chartData = [
    { name: "Mon", tasks: 4 },
    { name: "Tue", tasks: 7 },
    { name: "Wed", tasks: 5 },
    { name: "Thu", tasks: 8 },
    { name: "Fri", tasks: 12 },
    { name: "Sat", tasks: 2 },
    { name: "Sun", tasks: 1 },
  ];

  const pieData = [
    { name: "Todo", value: 40 },
    { name: "In Progress", value: 30 },
    { name: "Review", value: 20 },
    { name: "Done", value: 10 },
  ];

  return (
    <div className="space-y-12 font-mono">
      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 04</h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Institutional_Intelligence</h1>
        <div className="h-[1px] w-full bg-neutral-100" />
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Velocity Chart */}
        <div className="border border-neutral-100 p-8 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Operational_Velocity</h3>
              <TrendingUp className="h-4 w-4 text-neutral-300" />
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <ReBarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 8, fontFamily: "monospace", fill: "#a3a3a3" }}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 8, fontFamily: "monospace", fill: "#a3a3a3" }}
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: 0 }}
                   itemStyle={{ color: "#fff", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase" }}
                 />
                 <Bar dataKey="tasks" fill="#000" radius={0} />
               </ReBarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Distribution Pie */}
        <div className="border border-neutral-100 p-8 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">State_Distribution</h3>
              <PieChart className="h-4 w-4 text-neutral-300" />
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie
                   data={pieData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ backgroundColor: "#000", border: "none", borderRadius: 0 }}
                   itemStyle={{ color: "#fff", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase" }}
                 />
               </RePieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
         <div className="border border-neutral-100 p-6 space-y-2">
            <span className="text-[8px] uppercase tracking-widest text-neutral-300">Efficiency_Index</span>
            <p className="text-2xl font-bold tracking-tighter italic">92.4%</p>
         </div>
         <div className="border border-neutral-100 p-6 space-y-2">
            <span className="text-[8px] uppercase tracking-widest text-neutral-300">Personnel_Util</span>
            <p className="text-2xl font-bold tracking-tighter italic">0.78</p>
         </div>
         <div className="border border-black bg-black text-white p-6 space-y-2">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Risk_Coefficient</span>
            <p className="text-2xl font-bold tracking-tighter italic">LOW</p>
         </div>
      </div>
    </div>
  );
}
