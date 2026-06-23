"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Send, Hash, Paperclip, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Channel = {
  id: string;
  name: string | null;
  isReadonly: boolean | null;
  type: string;
};

interface ChatLayoutProps {
  channel: Channel;
  currentUserId: string;
}

export function ChatLayout({ channel, currentUserId }: ChatLayoutProps) {
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch } = trpc.chat.getMessages.useQuery(
    { channelId: channel.id },
    { refetchInterval: 3000 }
  );
  const { data: users = [] } = trpc.users.list.useQuery();

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => { setContent(""); refetch(); },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? "Unknown";
  const getInitials = (id: string) => {
    const name = getUserName(id);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isReadonly = channel.isReadonly && currentUserId !== "admin";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isReadonly) return;
    sendMessage.mutate({ channelId: channel.id, content });
  };

  // Group consecutive messages by same user
  const grouped = messages.slice().reverse().reduce<Array<{ userId: string; msgs: typeof messages }>>((acc, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.userId === msg.userId) {
      last.msgs.push(msg);
    } else {
      acc.push({ userId: msg.userId, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="flex h-full flex-col font-mono">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-neutral-100 px-6 bg-neutral-50/50 flex-shrink-0">
        <Hash className="mr-2 h-4 w-4 text-neutral-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{channel.name}</span>
        {channel.isReadonly && (
          <div className="ml-3 flex items-center space-x-1">
            <Lock className="h-3 w-3 text-neutral-300" />
            <span className="text-[8px] uppercase tracking-widest text-neutral-300">READ_ONLY</span>
          </div>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {grouped.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] uppercase tracking-widest text-neutral-300">No_Messages_Yet</p>
          </div>
        )}
        {grouped.map((group, gi) => (
          <div key={gi} className="flex items-start space-x-3 group">
            <div className={`h-8 w-8 flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${group.userId === currentUserId ? "bg-black text-white" : "bg-neutral-100 text-black"}`}>
              {getInitials(group.userId)}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-widest">{getUserName(group.userId)}</span>
                <span className="text-[8px] text-neutral-300 uppercase tracking-widest">
                  {format(new Date(group.msgs[0].createdAt), "HH:mm")}
                </span>
              </div>
              {group.msgs.map(msg => (
                <p key={msg.id} className="text-[11px] leading-relaxed text-neutral-700 break-words">
                  {msg.content}
                </p>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-100 p-4 bg-white flex-shrink-0">
        {isReadonly ? (
          <div className="flex items-center justify-center py-2">
            <Lock className="h-3 w-3 mr-2 text-neutral-300" />
            <span className="text-[9px] uppercase tracking-widest text-neutral-300">ANNOUNCEMENTS_ONLY</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative">
            <Input
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Message #${channel.name}...`}
              className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 pb-4 pr-24 text-[11px] focus-visible:border-black focus-visible:ring-0"
            />
            <div className="absolute bottom-0 right-0 flex items-center space-x-2 pb-4">
              <Button
                type="submit"
                disabled={!content.trim() || sendMessage.isPending}
                className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 transition-none px-4 text-[8px] font-bold tracking-[0.2em]"
              >
                <Send className="h-3 w-3 mr-1" />
                SEND
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
