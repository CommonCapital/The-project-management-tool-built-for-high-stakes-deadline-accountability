"use client";

import { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function RealtimeClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-bold tracking-widest uppercase">System_Clock</span>
      <span className="text-[8px] text-neutral-400 uppercase tracking-widest tabular-nums">
        {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
      </span>
    </div>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-neutral-100 font-mono">
      <div className="flex flex-1 justify-between px-6">
        <div className="flex flex-1">
          <form className="flex w-full md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">Search</label>
            <div className="relative w-full text-neutral-400 focus-within:text-neutral-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
              <Input
                id="search-field"
                className="block h-full w-full rounded-none border-transparent py-2 pl-8 pr-3 text-[10px] text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:placeholder-neutral-300 focus:outline-none focus:ring-0 sm:text-sm uppercase tracking-widest"
                placeholder="GLOBAL_SEARCH..."
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-6">
          <NotificationBell />
          <div className="h-4 w-[1px] bg-neutral-100" />
          <RealtimeClock />
        </div>
      </div>
    </header>
  );
}
