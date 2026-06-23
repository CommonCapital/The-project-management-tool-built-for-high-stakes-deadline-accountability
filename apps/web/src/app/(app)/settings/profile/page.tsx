"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { data: me, isLoading, refetch } = trpc.users.me.useQuery();
  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => { toast.success("PROFILE_UPDATED"); refetch(); },
    onError: (e) => toast.error(e.message || "UPDATE_FAILED"),
  });

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [bio, setBio] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!me) return;
    setName(me.name ?? "");
    setPosition((me as Record<string, unknown>).position as string ?? "");
    setBio((me as Record<string, unknown>).bio as string ?? "");
    setCvUrl((me as Record<string, unknown>).cvUrl as string ?? "");
    try {
      const rawSkills = (me as Record<string, unknown>).skills as string;
      setSkills(rawSkills ? JSON.parse(rawSkills) : []);
    } catch {
      setSkills([]);
    }
  }, [me]);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", "cv-upload"); // special marker

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setCvUrl(data.url);
        toast.success("CV_UPLOADED");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || skills.includes(s)) return;
    setSkills([...skills, s]);
    setNewSkill("");
  };

  const removeSkill = (s: string) => setSkills(skills.filter(sk => sk !== s));

  const handleSave = () => {
    updateProfile.mutate({ name, position, bio, cvUrl, skills });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-10 font-mono">
      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Settings // Profile</h2>
        <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Identity_Record</h1>
      </div>

      <div className="h-[1px] w-full bg-neutral-100" />

      <div className="space-y-8">
        {/* Avatar placeholder */}
        <div className="flex items-center space-x-6">
          <div className="h-16 w-16 bg-black text-white flex items-center justify-center text-xl font-bold">
            {name.slice(0, 2).toUpperCase() || "??"}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold">{me?.email}</p>
            <p className="text-[8px] text-neutral-400 uppercase tracking-widest mt-1">
              {(me as Record<string, unknown>)?.role as string ?? "MEMBER"}
            </p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Full_Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0 text-[11px]"
          />
        </div>

        {/* Position */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Position / Title</Label>
          <Input
            placeholder="E.G. SENIOR_ENGINEER, PRODUCT_MANAGER"
            value={position}
            onChange={e => setPosition(e.target.value)}
            className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0 text-[11px]"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Background / Bio</Label>
          <Textarea
            placeholder="Professional background, expertise, experience..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            className="rounded-none border border-neutral-200 bg-transparent focus-visible:border-black focus-visible:ring-0 text-[11px] resize-none"
          />
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Skills</Label>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {skills.map(s => (
              <div key={s} className="flex items-center space-x-1 border border-neutral-200 px-2 py-1">
                <span className="text-[8px] uppercase tracking-widest">{s}</span>
                <button onClick={() => removeSkill(s)} className="text-neutral-300 hover:text-black ml-1">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="ADD_SKILL..."
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0 text-[11px] flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={addSkill}
              className="rounded-none border border-neutral-200 hover:border-black text-[9px] uppercase tracking-widest transition-none"
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* CV Upload */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase tracking-widest text-neutral-400">CV / Resume</Label>
          {cvUrl && (
            <div className="flex items-center space-x-3 border border-neutral-100 p-3">
              <p className="text-[9px] text-neutral-500 flex-1 truncate">{cvUrl}</p>
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] uppercase tracking-widest text-black border-b border-black"
              >
                View
              </a>
              <button onClick={() => setCvUrl("")} className="text-neutral-300 hover:text-black">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} disabled={uploading} />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-none border border-dashed border-neutral-300 hover:border-black text-[9px] uppercase tracking-widest transition-none pointer-events-none"
            >
              <span>
                {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                {uploading ? "Uploading..." : "Upload_CV"}
              </span>
            </Button>
          </label>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-10 text-[10px] font-bold tracking-widest"
          >
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SAVE_CHANGES"}
          </Button>
        </div>
      </div>
    </div>
  );
}
