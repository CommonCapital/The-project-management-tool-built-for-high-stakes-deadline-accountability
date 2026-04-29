"use client";

import { useState } from "react";
import { Loader2, Bell, Mail, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PREFERENCES = [
  { id: "task_assigned", name: "TASK_ASSIGNMENT", description: "Notify when a new task is registered under your identity." },
  { id: "deadline_reminders", name: "DEADLINE_ESCALATION", description: "Receive warnings at T-72h, T-24h, and T-2h intervals." },
  { id: "mentions", name: "MENTION_ALERTS", description: "Notify when your unique identifier is tagged in communications." },
  { id: "daily_digest", name: "SYSTEM_SUMMARY", description: "Receive a daily email digest of all unread operational data." },
];

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-2xl space-y-12 font-mono">
      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 08</h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Alert_Protocols</h1>
        <div className="h-[1px] w-full bg-neutral-100" />
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
           <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-neutral-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Email_Dispatch</span>
           </div>
           <Switch className="rounded-none data-[state=checked]:bg-black" defaultChecked />
        </div>

        <div className="space-y-12">
          {PREFERENCES.map((pref) => (
            <div key={pref.id} className="flex items-start justify-between group">
              <div className="space-y-2">
                <Label className="text-[12px] font-bold uppercase tracking-widest group-hover:italic transition-none">
                  {pref.name}
                </Label>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest leading-relaxed max-w-sm">
                  {pref.description}
                </p>
              </div>
              <Switch className="rounded-none data-[state=checked]:bg-black mt-1" defaultChecked />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-12 border-t border-neutral-50">
         <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">
           Note: System-critical alerts (overdue escalation) cannot be disabled.
         </p>
      </div>
    </div>
  );
}
