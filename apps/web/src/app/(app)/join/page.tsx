"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function JoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const orgId = searchParams.get("org") ?? "";
  const called = useRef(false);

  const joinByToken = trpc.workspaces.joinByToken.useMutation({
    onSuccess: () => {
      toast.success("WORKSPACE_JOINED");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (e) => {
      toast.error(e.message || "INVALID_INVITE");
      router.push("/onboarding");
    },
  });

  useEffect(() => {
    if (called.current || !token || !orgId) return;
    called.current = true;
    joinByToken.mutate({ token, orgId });
  }, [token, orgId]); // eslint-disable-line

  return (
    <div className="flex h-screen items-center justify-center font-mono">
      <div className="space-y-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Joining_Workspace...</p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}
