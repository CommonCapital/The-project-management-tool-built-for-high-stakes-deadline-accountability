"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Failed to sign up");
      } else {
        toast.success("Account created successfully. Verification required.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 font-mono">
      <div className="w-full max-w-[350px] space-y-12">
        <div className="space-y-2 text-left">
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic">
            APEX
          </h1>
          <div className="h-[1px] w-full bg-black" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Establish New Identity
          </p>
        </div>

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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "INITIALIZE_ACCOUNT"}
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
