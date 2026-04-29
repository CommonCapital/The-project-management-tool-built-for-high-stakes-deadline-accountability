"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 font-mono">
      <div className="w-full max-w-[350px] space-y-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 bg-neutral-50 flex items-center justify-center border border-neutral-100">
            <Mail className="h-6 w-6 text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">Verification_Required</h1>
            <div className="h-[1px] w-full bg-black" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 leading-relaxed">
              Check your electronic mailbox for the validation sequence. Access is restricted until verification is confirmed.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Button 
            className="w-full rounded-none bg-black text-white hover:bg-neutral-800 transition-none py-6"
          >
            RESEND_SEQUENCE
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

        <div className="pt-12">
          <p className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">
            &copy; 2026 APEX Systems // Validation Node 01
          </p>
        </div>
      </div>
    </div>
  );
}
