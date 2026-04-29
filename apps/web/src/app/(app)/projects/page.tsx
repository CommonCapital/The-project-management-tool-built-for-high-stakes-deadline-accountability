"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 font-mono">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 03</h2>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Project_Catalog</h1>
        </div>
        <Button className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-8 text-[10px] font-bold tracking-widest">
          <Plus className="mr-2 h-4 w-4" />
          INITIATE_NEW_PROJECT
        </Button>
      </div>
      
      <div className="h-[1px] w-full bg-neutral-100" />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <div key={project.id} className="border border-neutral-100 p-8 space-y-6 hover:border-black transition-none cursor-pointer group">
            <div className="flex justify-between items-start">
               <div className="h-10 w-10 bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:bg-black group-hover:text-white transition-none">
                 {project.icon || "P"}
               </div>
               <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-300">#{project.id.slice(0, 8)}</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tighter uppercase italic">{project.name}</h3>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest line-clamp-2 leading-relaxed">
                {project.description || "NO_DESCRIPTION_PROVIDED"}
              </p>
            </div>

            <div className="pt-6 border-t border-neutral-50 flex justify-between items-center">
               <div className="flex flex-col">
                 <span className="text-[8px] text-neutral-300 uppercase tracking-widest">Deadline</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">
                   {project.deadline ? new Date(project.deadline).toLocaleDateString() : "UNDEFINED"}
                 </span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[8px] text-neutral-300 uppercase tracking-widest">Status</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-black">
                   {project.status}
                 </span>
               </div>
            </div>
          </div>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full py-24 text-center border border-dashed border-neutral-200">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-300 italic">No Active Projects Discovered</p>
          </div>
        )}
      </div>
    </div>
  );
}
