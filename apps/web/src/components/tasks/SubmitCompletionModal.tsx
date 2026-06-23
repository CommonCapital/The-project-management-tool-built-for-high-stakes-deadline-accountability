"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Paperclip, Loader2, X, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Props {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmitCompletionModal({ taskId, isOpen, onClose, onSuccess }: Props) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitCompletion = trpc.tasks.submitCompletion.useMutation({
    onSuccess: () => {
      toast.success("SUBMITTED_FOR_REVIEW");
      setNote("");
      setFile(null);
      onSuccess?.();
      onClose();
    },
    onError: (e) => toast.error(e.message || "SUBMISSION_FAILED"),
  });

  const handleSubmit = async () => {
    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("taskId", taskId);
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        attachmentUrl = data.url as string;
        attachmentName = file.name;
      } catch {
        toast.error("FILE_UPLOAD_FAILED");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    submitCompletion.mutate({ taskId, note: note || undefined, attachmentUrl, attachmentName });
  };

  const isPending = uploading || submitCompletion.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none border-neutral-100 font-mono">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">Submit_For_Review</DialogTitle>
          <div className="h-[1px] w-full bg-neutral-100" />
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Completion_Note</Label>
            <Textarea
              placeholder="Describe what was completed..."
              className="rounded-none border-neutral-200 focus-visible:border-black focus-visible:ring-0 min-h-[100px] text-[11px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Attachment (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-between border border-neutral-200 px-3 py-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                  <span className="text-[9px] truncate text-neutral-600 uppercase">{file.name}</span>
                  <span className="text-[8px] text-neutral-300 flex-shrink-0">
                    ({(file.size / 1024).toFixed(0)}KB)
                  </span>
                </div>
                <button onClick={() => setFile(null)} className="text-neutral-300 hover:text-black ml-2 flex-shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-neutral-200 p-6 flex flex-col items-center justify-center space-y-2 hover:bg-neutral-50 transition-none"
              >
                <Paperclip className="h-5 w-5 text-neutral-300" />
                <span className="text-[8px] uppercase tracking-widest text-neutral-300">
                  Click to attach file, image, or document
                </span>
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:space-x-0">
          <Button
            onClick={handleSubmit}
            className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SUBMIT_FOR_REVIEW"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-none text-[8px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none"
            disabled={isPending}
          >
            CANCEL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
