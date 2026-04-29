"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Paperclip, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SubmitCompletionModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitCompletionModal({ taskId, isOpen, onClose }: SubmitCompletionModalProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const updateStatus = trpc.tasks.updateStatus.useMutation();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateStatus.mutateAsync({
        taskId,
        status: "review",
      });
      toast.success("COMPLETION_SUBMITTED");
      onClose();
    } catch (err) {
      toast.error("SUBMISSION_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none border-neutral-100 font-mono">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">Operational_Completion</DialogTitle>
          <div className="h-[1px] w-full bg-neutral-100" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Completion_Log</Label>
            <Textarea 
              placeholder="ENTER_SUBMISSION_DETAILS..."
              className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 min-h-[120px] text-[11px] uppercase tracking-widest"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Supporting_Evidence</Label>
            <div className="border border-dashed border-neutral-200 p-8 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-neutral-50 transition-none">
               <Paperclip className="h-5 w-5 text-neutral-300" />
               <span className="text-[8px] uppercase tracking-widest text-neutral-300">ATTACH_ARTIFACTS</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col space-y-4 sm:space-x-0">
          <Button 
            onClick={handleSubmit}
            className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 text-[10px] font-bold tracking-[0.2em]"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "EXECUTE_SUBMISSION"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full rounded-none text-[8px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none"
          >
            ABORT_SUBMISSION
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
