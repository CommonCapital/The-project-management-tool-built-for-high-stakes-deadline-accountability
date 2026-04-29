"use client";

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  { id: "todo", name: "QUEUE" },
  { id: "in_progress", name: "PROCESSING" },
  { id: "review", name: "VALIDATION" },
  { id: "done", name: "ARCHIVED" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId });

  return (
    <div className="flex h-full space-x-6 overflow-x-auto pb-8 font-mono">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex w-80 flex-shrink-0 flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">{column.name}</h3>
            <span className="text-[8px] text-neutral-400">
              {tasks.filter((t) => t.status === column.id).length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {tasks
              .filter((t) => t.status === column.id)
              .map((task) => (
                <div
                  key={task.id}
                  className="border border-neutral-100 bg-white p-4 space-y-4 hover:border-black transition-none cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-[6px] font-bold uppercase tracking-widest px-1.5 py-0.5",
                      task.priority === "urgent" ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"
                    )}>
                      {task.priority}
                    </span>
                    <MoreHorizontal className="h-3 w-3 text-neutral-300" />
                  </div>
                  
                  <h4 className="text-[11px] font-bold uppercase tracking-tight leading-tight group-hover:italic transition-none">
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between pt-2">
                     <div className="h-5 w-5 bg-neutral-50 border border-neutral-100 flex items-center justify-center text-[8px]">
                       U
                     </div>
                     <span className="text-[8px] text-neutral-300 uppercase tracking-widest">
                       {task.deadline ? new Date(task.deadline).toLocaleDateString() : "---"}
                     </span>
                  </div>
                </div>
              ))}
            
            <Button variant="ghost" className="w-full rounded-none border border-dashed border-neutral-200 text-[8px] uppercase tracking-widest py-6 text-neutral-300 hover:text-black hover:border-black transition-none">
              <Plus className="mr-2 h-3 w-3" />
              ADD_ENTITY
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
