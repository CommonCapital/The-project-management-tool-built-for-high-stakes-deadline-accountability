"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // useWebSocket(); — WS server not running, chat uses polling

  const { data: user, isLoading, error } = trpc.users.me.useQuery();

  useEffect(() => {
    if (isLoading) return;
    if (error) {
      // Stale/invalid session cookie — sign out server-side to clear HttpOnly cookie
      authClient.signOut().finally(() => router.replace("/login"));
      return;
    }
    if (!user) return;
    if (!user.orgId && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
    if (user.orgId && pathname === "/onboarding") {
      router.push("/dashboard");
    }
  }, [user, isLoading, error, pathname, router]);

  if (isLoading || error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user?.orgId && pathname !== "/onboarding") {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar role={user?.role || "member"} userName={user?.name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-white p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
