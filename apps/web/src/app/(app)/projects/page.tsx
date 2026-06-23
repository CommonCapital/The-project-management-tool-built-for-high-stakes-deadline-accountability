"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProjectsPage() {
  const router = useRouter();
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", deadline: "" });

  const { data: me } = trpc.users.me.useQuery();
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();

  const isAdmin = me?.role === "admin";

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (p) => {
      toast.success("PROJECT_INITIATED");
      setCreateModal(false);
      setForm({ name: "", description: "", deadline: "" });
      refetch();
      router.push(`/projects/${p.id}`);
    },
    onError: (e) => toast.error(e.message || "CREATE_FAILED"),
  });

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
        {isAdmin && (
          <Button
            onClick={() => setCreateModal(true)}
            className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-8 text-[10px] font-bold tracking-widest"
          >
            <Plus className="mr-2 h-4 w-4" />
            INITIATE_NEW_PROJECT
          </Button>
        )}
      </div>

      <div className="h-[1px] w-full bg-neutral-100" />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map(project => (
          <div
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="border border-neutral-100 p-8 space-y-6 hover:border-black transition-none cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div
                className="h-10 w-10 flex items-center justify-center border border-neutral-100 group-hover:bg-black group-hover:text-white transition-none text-lg"
                style={{ backgroundColor: project.color || undefined }}
              >
                {project.icon || project.name.slice(0, 1).toUpperCase()}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 ${
                project.status === "active" ? "bg-black text-white" :
                project.status === "completed" ? "bg-neutral-100 text-neutral-500" :
                "bg-neutral-200 text-neutral-500"
              }`}>
                {project.status}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tighter uppercase italic">{project.name}</h3>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest line-clamp-2 leading-relaxed">
                {project.description || "NO_DESCRIPTION_PROVIDED"}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-50 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[8px] text-neutral-300 uppercase tracking-widest">Deadline</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "UNDEFINED"}
                </span>
              </div>
            </div>
          </div>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full py-24 text-center border border-dashed border-neutral-200">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-300 italic">
              {isAdmin ? "No Projects Yet — Click Initiate to Create One" : "No Active Projects Discovered"}
            </p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-lg rounded-none border-neutral-200 font-mono">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">Initiate_Project</DialogTitle>
            <div className="h-[1px] w-full bg-neutral-100" />
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Project_Name *</Label>
              <Input
                placeholder="PROJECT_CODENAME"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 text-[11px] uppercase tracking-wide"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Description</Label>
              <Textarea
                placeholder="ENTER_PROJECT_BRIEF..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 min-h-[80px] text-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 text-[11px]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col space-y-2 sm:space-x-0">
            <Button
              onClick={() => createProject.mutate({
                name: form.name,
                description: form.description || undefined,
                deadline: form.deadline ? new Date(form.deadline) : undefined,
              })}
              disabled={createProject.isPending || !form.name}
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
            >
              {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "INITIATE_PROJECT"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCreateModal(false)}
              className="w-full rounded-none text-[8px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none"
            >
              ABORT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
