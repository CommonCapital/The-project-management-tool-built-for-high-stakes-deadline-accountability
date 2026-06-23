"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const utils = trpc.useUtils();

  const createWorkspace = trpc.workspaces.create.useMutation({
    onSuccess: async () => {
      toast.success("WORKSPACE_INITIALIZED");
      await utils.users.me.invalidate();
      router.push("/dashboard");
      router.refresh();
    },
    onError: (e) => toast.error(e.message || "INITIALIZATION_FAILED"),
  });

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    createWorkspace.mutate({ name: name.trim(), slug });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 font-mono">
      <div className="w-full max-w-[400px] space-y-12">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic">APEX</h1>
          <div className="h-[1px] w-full bg-black" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Initialize_Workspace
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest">Step 01 — Establish_Base</p>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest leading-relaxed">
            Create your organization workspace. You will be assigned as administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400">
              Organization_Name
            </Label>
            <Input
              placeholder="ACME_CORP"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0 uppercase tracking-widest"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400">
              Workspace_Slug
            </Label>
            <Input
              placeholder="acme-corp"
              required
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0 tracking-widest"
            />
            <p className="text-[8px] text-neutral-300 uppercase tracking-widest">
              Lowercase letters, numbers, hyphens only
            </p>
          </div>

          <Button
            type="submit"
            disabled={createWorkspace.isPending || !name || !slug}
            className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 text-[10px] font-bold tracking-[0.2em]"
          >
            {createWorkspace.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : "DEPLOY_WORKSPACE"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">
            &copy; 2026 APEX Systems // Authorization Required
          </p>
        </div>
      </div>
    </div>
  );
}
