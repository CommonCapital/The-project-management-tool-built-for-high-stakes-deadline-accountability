import Link from "next/link";

const FEATURES = [
  { code: "01", label: "Task_Management", desc: "Assign, track, and approve work with full priority and deadline control." },
  { code: "02", label: "KPI_Engine", desc: "Priority-weighted performance scores. Completion rate meets on-time rate." },
  { code: "03", label: "Calendar_View", desc: "Week-by-week assignment scheduling. Files, summaries, admin approval loop." },
  { code: "04", label: "Analytics", desc: "Workspace health matrix. Per-project breakdowns. Real-time risk levels." },
  { code: "05", label: "Team_Chat", desc: "Channel-based communication for every workspace. Read-only announcements." },
  { code: "06", label: "Personnel_Registry", desc: "Role management, profiles, CVs, skills. Full audit trail." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-neutral-100 px-12 py-5">
        <span className="text-lg font-bold tracking-tighter uppercase italic">APEX</span>
        <div className="flex items-center space-x-8">
          <Link
            href="/login"
            className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-none border-b border-transparent hover:border-black"
          >
            Sign_In
          </Link>
          <Link
            href="/register"
            className="text-[10px] uppercase tracking-[0.2em] bg-black text-white px-6 py-3 hover:bg-neutral-800 transition-none"
          >
            Create_Workspace
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-12 py-32 max-w-5xl">
        <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-400 mb-8">
          Project_Management // v1.0
        </p>
        <h1 className="text-7xl font-bold tracking-tighter uppercase italic leading-none mb-8">
          Work.<br />Tracked.<br />Approved.
        </h1>
        <p className="text-[12px] text-neutral-500 uppercase tracking-[0.15em] max-w-md leading-relaxed mb-12">
          A workspace OS for teams that take deadlines seriously. Assign work, measure performance, and keep everyone accountable — in one place.
        </p>
        <div className="flex items-center space-x-4">
          <Link
            href="/register"
            className="text-[10px] uppercase tracking-[0.2em] bg-black text-white px-10 py-5 hover:bg-neutral-800 transition-none font-bold"
          >
            Initialize_Workspace →
          </Link>
          <Link
            href="/login"
            className="text-[10px] uppercase tracking-[0.2em] border border-neutral-200 px-10 py-5 hover:border-black transition-none"
          >
            Sign_In
          </Link>
        </div>
      </section>

      <div className="h-[1px] w-full bg-neutral-100" />

      {/* Features grid */}
      <section className="px-12 py-24">
        <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-300 mb-12">
          Core_Modules
        </p>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.code}
              className="border border-neutral-100 p-8 space-y-4 hover:bg-neutral-50 transition-none"
            >
              <span className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">{f.code}</span>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]">{f.label}</h3>
              <p className="text-[10px] text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-[1px] w-full bg-neutral-100" />

      {/* How it works */}
      <section className="px-12 py-24 max-w-4xl">
        <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-300 mb-12">Protocol</p>
        <div className="space-y-0">
          {[
            { step: "01", who: "Admin", action: "Creates workspace → gets shareable invite link" },
            { step: "02", who: "Employee", action: "Registers using the invite link → auto-joins workspace as member" },
            { step: "03", who: "Admin", action: "Creates projects, assigns tasks with deadlines and priorities" },
            { step: "04", who: "Employee", action: "Completes work → submits with summary and optional file attachment" },
            { step: "05", who: "Admin", action: "Reviews submission → approves or sends back for revision" },
            { step: "06", who: "System", action: "Calculates KPI: priority-weighted completion rate × on-time adherence" },
          ].map(item => (
            <div key={item.step} className="flex items-start border-b border-neutral-100 py-6 space-x-8">
              <span className="text-[8px] uppercase tracking-widest text-neutral-300 w-6 flex-shrink-0 pt-1">{item.step}</span>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 w-20 flex-shrink-0 pt-0.5">{item.who}</span>
              <span className="text-[11px] uppercase tracking-wider text-black">{item.action}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="h-[1px] w-full bg-neutral-100" />

      {/* CTA */}
      <section className="px-12 py-32 flex flex-col items-start space-y-8">
        <h2 className="text-5xl font-bold tracking-tighter uppercase italic">Ready to deploy?</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 max-w-sm leading-relaxed">
          Admins create a workspace. Employees join via invite. Everyone stays accountable.
        </p>
        <Link
          href="/register"
          className="text-[10px] uppercase tracking-[0.2em] bg-black text-white px-12 py-6 hover:bg-neutral-800 transition-none font-bold text-sm"
        >
          Create_Workspace →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 px-12 py-6 flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">
          &copy; 2026 APEX Systems // All_Rights_Reserved
        </span>
        <span className="text-[8px] uppercase tracking-[0.3em] text-neutral-300">
          Authorization_Required
        </span>
      </footer>
    </div>
  );
}
