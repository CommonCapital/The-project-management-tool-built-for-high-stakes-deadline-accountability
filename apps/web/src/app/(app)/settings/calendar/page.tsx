"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function CalendarSettingsPage() {
  const searchParams = useSearchParams();
  const { data: user, isLoading, refetch } = trpc.users.me.useQuery();
  const isConnected = !!user?.calendarRefreshToken;

  useEffect(() => {
    if (searchParams.get("success") === "connected") {
      toast.success("Google Calendar connected successfully");
      refetch();
    } else if (searchParams.get("error")) {
      toast.error("Failed to connect Google Calendar");
    }
  }, [searchParams, refetch]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-12 font-mono">
      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 07</h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">External_Synchronicity</h1>
        <div className="h-[1px] w-full bg-neutral-100" />
      </div>

      <div className="border border-neutral-100 p-8 space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
             <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-neutral-50 flex items-center justify-center border border-neutral-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold uppercase tracking-widest">Google_Calendar_v3</span>
                  <span className="text-[8px] text-neutral-400 uppercase tracking-widest">Protocol: OAuth2.0</span>
                </div>
             </div>
             <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed max-w-sm">
               Synchronize APEX task deadlines directly with your primary Google Calendar. 
               Updates occur automatically upon state transitions.
             </p>
          </div>
          
          <div className="flex flex-col items-end">
             {isConnected ? (
               <div className="flex items-center space-x-2 text-black">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">LINK_ESTABLISHED</span>
               </div>
             ) : (
               <div className="flex items-center space-x-2 text-neutral-300">
                  <XCircle className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">OFFLINE</span>
               </div>
             )}
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-50 flex space-x-4">
          {!isConnected ? (
            <Button 
              asChild
              className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-8 text-[10px] font-bold tracking-widest"
            >
              <a href="/api/calendar/connect">
                AUTHORIZE_CONNECTION
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="rounded-none border-neutral-200 text-black hover:bg-neutral-50 transition-none py-6 px-8 text-[10px] font-bold tracking-widest"
            >
              REVOKE_ACCESS
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">Operational_Parameters</h3>
         <ul className="space-y-2">
            {[
              "Auto-create events on task assignment",
              "Update start/end times on deadline shifts",
              "Delete events on task completion/archival"
            ].map((param, i) => (
              <li key={i} className="flex items-center text-[8px] uppercase tracking-widest text-neutral-400">
                <span className="h-1 w-1 bg-black mr-2" />
                {param}
              </li>
            ))}
         </ul>
      </div>
    </div>
  );
}
