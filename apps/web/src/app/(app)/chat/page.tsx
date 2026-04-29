"use client";

import { ChatLayout } from "@/components/chat/ChatLayout";
import { trpc } from "@/lib/trpc";
import { Hash, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { data: channels = [], isLoading } = trpc.chat.getChannels.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full font-mono">
      {/* Channel Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col space-y-8 pr-8 border-r border-neutral-100">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300">Channels</h3>
          <div className="space-y-1">
            {channels.map((channel) => (
              <div 
                key={channel.id}
                className={cn(
                  "flex items-center px-3 py-2 text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-none",
                  channel.name === "general" ? "bg-black text-white" : "text-neutral-400 hover:bg-neutral-50 hover:text-black"
                )}
              >
                <Hash className="mr-2 h-3 w-3" />
                {channel.name}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300">Direct_Comms</h3>
          <div className="space-y-1">
            <div className="flex items-center px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:bg-neutral-50 hover:text-black cursor-pointer transition-none">
              <span className="mr-2 h-2 w-2 bg-neutral-200" />
              User_Alpha
            </div>
            <div className="flex items-center px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:bg-neutral-50 hover:text-black cursor-pointer transition-none">
              <span className="mr-2 h-2 w-2 bg-neutral-200" />
              User_Beta
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 pl-8">
        <ChatLayout channelId="default-general" />
      </div>
    </div>
  );
}
