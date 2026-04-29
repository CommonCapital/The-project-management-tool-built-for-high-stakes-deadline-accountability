"use client";

import { trpc } from "@/lib/trpc";
import { 
  Clock, 
  User, 
  Calendar, 
  AlertTriangle, 
  Paperclip,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { data: task, isLoading } = trpc.tasks.getById.useQuery({ id: taskId });

  if (isLoading) return <div className="animate-pulse h-64 bg-neutral-50" />;
  if (!task) return <div className="text-[10px] uppercase tracking-widest text-neutral-300">Entity_Not_Found</div>;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 font-mono">
      <div className="lg:col-span-2 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Badge className={cn(
              "rounded-none px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] font-bold",
              task.priority === "urgent" ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"
            )}>
              {task.priority}
            </Badge>
            <span className="text-[10px] text-neutral-300 uppercase tracking-widest">#{task.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase italic">{task.title}</h1>
          <div className="h-[1px] w-full bg-neutral-100" />
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-[12px] leading-relaxed uppercase tracking-wide text-neutral-600">
            {task.description || "NO_DESCRIPTION_DATA"}
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] border-b border-neutral-100 pb-2">Action_Log</h3>
          <div className="space-y-4">
            {/* Activity log entries would go here */}
            <div className="flex items-start space-x-3 text-[10px] uppercase tracking-widest text-neutral-400">
              <span className="text-black font-bold">SYSLOG:</span>
              <span>Task initialized and registered in database.</span>
              <span className="ml-auto text-[8px]">{new Date(task.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 border-l border-neutral-100 pl-12">
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-widest text-neutral-300">Operational_Status</span>
            <div className="flex items-center space-x-2">
               <div className="h-2 w-2 rounded-full bg-black animate-pulse" />
               <span className="text-[12px] font-bold uppercase tracking-widest">{task.status}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-widest text-neutral-300">Primary_Assignee</span>
            <div className="flex items-center space-x-2">
               <User className="h-3 w-3" />
               <span className="text-[12px] font-bold uppercase tracking-widest">User_Identifier</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-widest text-neutral-300">Timeline_Threshold</span>
            <div className="flex items-center space-x-2">
               <Calendar className="h-3 w-3" />
               <span className="text-[12px] font-bold uppercase tracking-widest">
                 {task.deadline ? new Date(task.deadline).toLocaleString() : "NONE"}
               </span>
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-4">
           <Button className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 text-[10px] font-bold tracking-[0.2em]">
             EXECUTE_COMPLETION
           </Button>
           <Button variant="outline" className="w-full rounded-none border-neutral-200 text-black hover:bg-neutral-50 transition-none py-6 text-[10px] font-bold tracking-[0.2em]">
             REQUEST_REVISION
           </Button>
        </div>
      </div>
    </div>
  );
}
