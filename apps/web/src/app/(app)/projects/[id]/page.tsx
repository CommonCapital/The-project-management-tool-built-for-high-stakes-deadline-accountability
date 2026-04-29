"use client";

import { trpc } from "@/lib/trpc";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { Loader2, Settings, Users, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: params.id });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!project) return <div>Entity_Not_Found</div>;

  return (
    <div className="flex flex-col h-full space-y-8 font-mono">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Project // {project.id.slice(0, 8)}</h2>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">{project.name}</h1>
        </div>
        <div className="flex space-x-4">
           <div className="flex flex-col items-end">
             <span className="text-[8px] uppercase tracking-widest text-neutral-300">Phase</span>
             <span className="text-[12px] font-bold uppercase tracking-widest text-black">{project.status}</span>
           </div>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-neutral-100 h-auto p-0 space-x-8">
          <TabsTrigger 
            value="tasks" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-widest transition-none"
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Operational_Board
          </TabsTrigger>
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-widest transition-none"
          >
            <Info className="mr-2 h-4 w-4" />
            Intelligence_Overview
          </TabsTrigger>
          <TabsTrigger 
            value="team" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-widest transition-none"
          >
            <Users className="mr-2 h-4 w-4" />
            Personnel_Roster
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-widest transition-none ml-auto"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="flex-1 pt-8 outline-none">
          <KanbanBoard projectId={project.id} />
        </TabsContent>
        <TabsContent value="overview" className="flex-1 pt-8 outline-none">
          {/* Project overview charts/stats */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { CheckSquare } from "lucide-react";
