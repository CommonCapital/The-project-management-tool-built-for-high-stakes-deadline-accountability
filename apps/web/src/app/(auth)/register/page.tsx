"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2, Link2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  const inviteOrg = searchParams.get("org");
  const isInvited = !!(inviteToken && inviteOrg);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgPreview, setOrgPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isInvited) return;
    // Fetch org name preview via API
    fetch(`/api/trpc/workspaces.getInviteInfo?input=${encodeURIComponent(JSON.stringify({ json: { orgId: inviteOrg, token: inviteToken } }))}`)
      .then(r => r.json())
      .then(data => {
        const orgName = data?.result?.data?.json?.orgName;
        if (orgName) setOrgPreview(orgName);
      })
      .catch(() => {});
  }, [isInvited, inviteToken, inviteOrg]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: isInvited
          ? `/join?token=${inviteToken}&org=${inviteOrg}`
          : "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Registration failed");
      }
      // callbackURL handles redirect
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 font-mono">
      <div className="w-full max-w-[350px] space-y-12">
        <div className="space-y-2 text-left">
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic">APEX</h1>
          <div className="h-[1px] w-full bg-black" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Establish New Identity
          </p>
        </div>

        {isInvited && (
          <div className="border border-black p-4 space-y-1">
            <div className="flex items-center space-x-2">
              <Link2 className="h-3 w-3" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Workspace_Invitation</span>
            </div>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">
              You are joining: <span className="text-black font-bold">{orgPreview ?? "Loading..."}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-neutral-400">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="SURNAME, GIVEN"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-neutral-400">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="CONTACT@DOMAIN.COM"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-neutral-400">
                Secret Credential
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 focus-visible:border-black focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button
              type="submit"
              className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isInvited ? "JOIN_WORKSPACE" : "INITIALIZE_ACCOUNT"}
            </Button>

            <div className="flex justify-center text-[10px] uppercase tracking-widest">
              <Link
                href="/login"
                className="text-neutral-500 hover:text-black transition-none border-b border-transparent hover:border-black"
              >
                Return to Login
              </Link>
            </div>
          </div>
        </form>

        <div className="pt-12 text-center">
          <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">
            &copy; 2026 APEX Systems // Authorization Required
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
