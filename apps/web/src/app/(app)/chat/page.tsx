"use client";

import { useState } from "react";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { trpc } from "@/lib/trpc";
import { Hash, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

export default function ChatPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const { data: me } = trpc.users.me.useQuery();
  const { data: channels = [], isLoading, refetch } = trpc.chat.getChannels.useQuery();

  const createChannel = trpc.workspaces.createChannel.useMutation({
    onSuccess: (ch) => {
      toast.success(`#${ch.name} created`);
      setCreateModal(false);
      setNewChannelName("");
      refetch();
      setSelectedChannelId(ch.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const activeChannel = channels.find(c => c.id === selectedChannelId) ?? channels[0] ?? null;
  const isAdmin = me?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full font-mono -m-8">
      {/* Channel Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-neutral-100 pt-8 pb-4">
        <div className="px-4 mb-4 flex items-center justify-between">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-300">Channels</h3>
          {isAdmin && (
            <button
              onClick={() => setCreateModal(true)}
              className="text-neutral-300 hover:text-black transition-none"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 px-2">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-none text-left",
                activeChannel?.id === channel.id
                  ? "bg-black text-white"
                  : "text-neutral-400 hover:bg-neutral-50 hover:text-black"
              )}
            >
              <Hash className="mr-2 h-3 w-3 flex-shrink-0" />
              <span className="truncate">{channel.name}</span>
              {channel.isReadonly && (
                <span className="ml-auto text-[7px] opacity-50">RO</span>
              )}
            </button>
          ))}
          {channels.length === 0 && (
            <p className="px-3 py-2 text-[9px] text-neutral-300 uppercase tracking-widest">No_Channels</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        {activeChannel ? (
          <ChatLayout channel={activeChannel} currentUserId={me?.id ?? ""} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[10px] uppercase tracking-widest text-neutral-300">Select_Channel</p>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-sm rounded-none border-neutral-200 font-mono">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">Create_Channel</DialogTitle>
            <div className="h-[1px] w-full bg-neutral-100" />
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Channel_Name</Label>
              <Input
                placeholder="e.g. design-team"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 text-[11px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col space-y-2 sm:space-x-0">
            <Button
              onClick={() => createChannel.mutate({ name: newChannelName })}
              disabled={createChannel.isPending || !newChannelName.trim()}
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
            >
              CREATE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
