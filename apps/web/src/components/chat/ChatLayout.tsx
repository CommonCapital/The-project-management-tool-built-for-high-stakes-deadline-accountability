"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Send, Hash, User, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatLayout({ channelId }: { channelId: string }) {
  const [content, setContent] = useState("");
  const { data: messages = [] } = trpc.chat.getMessages.useQuery({ channelId });
  const sendMessage = trpc.chat.sendMessage.useMutation();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage.mutate({ channelId, content });
    setContent("");
  };

  return (
    <div className="flex h-full flex-col font-mono border border-neutral-100">
      {/* Chat Header */}
      <div className="flex h-14 items-center border-b border-neutral-100 px-6 bg-neutral-50/50">
        <Hash className="mr-2 h-4 w-4 text-neutral-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest">General_Channel</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="group flex items-start space-x-3">
             <div className="h-8 w-8 bg-black text-white flex items-center justify-center text-[8px] flex-shrink-0">
               U
             </div>
             <div className="space-y-1">
               <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest">User_ID</span>
                 <span className="text-[8px] text-neutral-300 uppercase tracking-widest">
                   {new Date(msg.createdAt).toLocaleTimeString()}
                 </span>
               </div>
               <p className="text-[11px] leading-relaxed uppercase tracking-tight text-neutral-600">
                 {msg.content}
               </p>
             </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-100 p-6 bg-white">
        <form onSubmit={handleSend} className="relative">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ENCRYPT_MESSAGE..."
            className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 pb-4 pr-24 text-[11px] focus-visible:border-black focus-visible:ring-0 uppercase tracking-widest"
          />
          <div className="absolute bottom-0 right-0 flex items-center space-x-2 pb-4">
             <Button type="button" variant="ghost" className="h-8 w-8 rounded-none p-0 hover:bg-neutral-50 transition-none">
               <Paperclip className="h-4 w-4 text-neutral-300" />
             </Button>
             <Button type="submit" className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 transition-none px-4 text-[8px] font-bold tracking-[0.2em]">
               SEND_LOG
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
