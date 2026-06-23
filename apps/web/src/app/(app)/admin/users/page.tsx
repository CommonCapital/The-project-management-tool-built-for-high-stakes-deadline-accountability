"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldCheck, Mail, UserPlus, Copy, Check, Link2, ExternalLink } from "lucide-react";
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
import { cn } from "@/lib/utils";
import Link from "next/link";

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-black text-white",
  manager: "bg-neutral-800 text-white",
  member: "bg-neutral-100 text-neutral-600",
};

export default function AdminUsersPage() {
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [workspaceLink, setWorkspaceLink] = useState<string | null>(null);
  const [copiedWs, setCopiedWs] = useState(false);

  const { data: users = [], isLoading, refetch } = trpc.users.list.useQuery();
  const { data: invitations = [] } = trpc.workspaces.getPendingInvitations.useQuery();

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("ROLE_UPDATED"); refetch(); },
    onError: (e) => toast.error(e.message || "UPDATE_FAILED"),
  });

  const generateWsLink = trpc.workspaces.generateInviteLink.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/register?token=${data.inviteToken}&org=${data.orgId}`;
      setWorkspaceLink(link);
      toast.success("INVITE_LINK_GENERATED");
    },
    onError: (e) => toast.error(e.message || "GENERATE_FAILED"),
  });

  const handleCopyWsLink = async () => {
    if (!workspaceLink) return;
    await navigator.clipboard.writeText(workspaceLink);
    setCopiedWs(true);
    setTimeout(() => setCopiedWs(false), 2000);
  };

  const createInvitation = trpc.workspaces.createEmailInvitation.useMutation({
    onSuccess: (inv) => {
      const link = `${window.location.origin}/register?invite=${inv.id}`;
      setInviteLink(link);
      toast.success("INVITATION_CREATED");
    },
    onError: (e) => toast.error(e.message || "INVITE_FAILED"),
  });

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 font-mono">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Section // 05</h2>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Personnel_Registry</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => generateWsLink.mutate()}
            disabled={generateWsLink.isPending}
            variant="ghost"
            className="rounded-none border border-neutral-200 hover:border-black transition-none py-6 px-6 text-[10px] font-bold tracking-widest"
          >
            {generateWsLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Link2 className="mr-2 h-4 w-4" /> WORKSPACE_LINK</>}
          </Button>
          <Button
            onClick={() => { setInviteModal(true); setInviteLink(null); }}
            className="rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6 px-8 text-[10px] font-bold tracking-widest"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            INVITE_PERSONNEL
          </Button>
        </div>
      </div>

      {/* Workspace invite link banner */}
      {workspaceLink && (
        <div className="border border-black p-4 flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Link2 className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-widest text-neutral-400 mb-1">Workspace_Invite_Link — share with new employees</p>
              <p className="text-[9px] font-mono truncate">{workspaceLink}</p>
            </div>
          </div>
          <button
            onClick={handleCopyWsLink}
            className="flex-shrink-0 p-2 border border-neutral-200 hover:border-black transition-none"
          >
            {copiedWs ? <Check className="h-4 w-4 text-black" /> : <Copy className="h-4 w-4 text-neutral-400" />}
          </button>
        </div>
      )}

      <div className="h-[1px] w-full bg-neutral-100" />

      <div className="border border-neutral-100">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest">Personnel_Entity</th>
              <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest">Access_Level</th>
              <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest">Change_Role</th>
              <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-neutral-50 transition-none">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-black text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                      {u.name?.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[9px] text-neutral-400">{u.email}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-3 w-3 text-neutral-400" />
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-1", ROLE_STYLES[u.role ?? "member"])}>
                      {u.role ?? "MEMBER"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-1", u.isActive ? "bg-black text-white" : "bg-neutral-100 text-neutral-400")}>
                    {u.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.role ?? "member"}
                    onChange={e => updateRole.mutate({ userId: u.id, role: e.target.value as "admin" | "manager" | "member" })}
                    className="border border-neutral-200 px-2 py-1 text-[9px] uppercase tracking-wide bg-white focus:outline-none focus:border-black"
                  >
                    <option value="member">MEMBER</option>
                    <option value="manager">MANAGER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="inline-flex items-center text-[8px] uppercase tracking-widest text-neutral-400 hover:text-black transition-none border-b border-transparent hover:border-black"
                  >
                    View <ExternalLink className="h-2.5 w-2.5 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Pending_Invitations</h3>
          <div className="border border-neutral-100">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Email</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Role</th>
                  <th className="px-6 py-3 text-[8px] font-bold uppercase tracking-widest">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3 text-[10px]">{inv.email}</td>
                    <td className="px-6 py-3">
                      <span className="text-[8px] uppercase tracking-widest px-2 py-1 bg-neutral-100">{inv.role}</span>
                    </td>
                    <td className="px-6 py-3 text-[9px] text-neutral-400">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={inviteModal} onOpenChange={open => { setInviteModal(open); if (!open) setInviteLink(null); }}>
        <DialogContent className="max-w-md rounded-none border-neutral-200 font-mono">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-bold uppercase tracking-[0.3em]">Invite_Personnel</DialogTitle>
            <div className="h-[1px] w-full bg-neutral-100" />
          </DialogHeader>

          {inviteLink ? (
            <div className="space-y-4 py-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                Invitation created. Share this link with the invitee:
              </p>
              <div className="flex items-center space-x-2 border border-neutral-200 p-3">
                <p className="text-[9px] text-neutral-600 flex-1 truncate font-mono">{inviteLink}</p>
                <button onClick={handleCopyLink} className="text-neutral-400 hover:text-black">
                  {copied ? <Check className="h-4 w-4 text-black" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[8px] text-neutral-300 uppercase tracking-widest">
                Link expires in 7 days. Invitee must register to join.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Email_Address</Label>
                <div className="flex items-center border-b border-neutral-200 pb-2">
                  <Mail className="h-4 w-4 text-neutral-300 mr-2" />
                  <Input
                    type="email"
                    placeholder="CONTACT@DOMAIN.COM"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="border-0 rounded-none focus-visible:ring-0 text-[11px] px-0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400">Access_Level</Label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as "admin" | "manager" | "member")}
                  className="w-full border border-neutral-200 px-3 py-2 text-[10px] uppercase tracking-wide bg-white focus:outline-none focus:border-black"
                >
                  <option value="member">MEMBER</option>
                  <option value="manager">MANAGER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col space-y-2 sm:space-x-0">
            {!inviteLink ? (
              <Button
                onClick={() => createInvitation.mutate({ email: inviteEmail, role: inviteRole })}
                disabled={createInvitation.isPending || !inviteEmail}
                className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
              >
                {createInvitation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "GENERATE_INVITE"}
              </Button>
            ) : (
              <Button
                onClick={() => { setInviteModal(false); setInviteLink(null); setInviteEmail(""); }}
                className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-5 text-[10px] font-bold tracking-[0.2em]"
              >
                DONE
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
