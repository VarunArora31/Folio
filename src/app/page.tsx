import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/documents");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0eeeb", color: "#1c1c1e" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-10 h-[60px]"
        style={{ background: "rgba(31,31,33,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #3a3a3c" }}>
        {/* Left nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[12px] font-medium tracking-[0.08em] uppercase transition-colors hover:text-white" style={{ color: "#aeaeb2" }}>Features</a>
          <a href="#templates" className="text-[12px] font-medium tracking-[0.08em] uppercase transition-colors hover:text-white" style={{ color: "#aeaeb2" }}>Templates</a>
        </nav>

        {/* Center logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 select-none">
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="6" fill="white" />
            <rect x="8" y="9"  width="14" height="2.5" rx="1.25" fill="black" />
            <rect x="8" y="15" width="20" height="2.5" rx="1.25" fill="black" />
            <rect x="8" y="21" width="16" height="2.5" rx="1.25" fill="black" />
            <rect x="8" y="27" width="11" height="2.5" rx="1.25" fill="black" />
          </svg>
          <span className="text-[18px] font-bold tracking-[0.15em] uppercase" style={{ color: "#ffffff", letterSpacing: "0.18em" }}>FOLIO</span>
        </Link>

        {/* Right auth */}
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-[12px] font-medium tracking-[0.08em] uppercase transition-colors hover:text-white" style={{ color: "#aeaeb2" }}>
            Sign in
          </Link>
          <Link href="/sign-up"
            className="hidden sm:inline-flex text-[12px] font-bold tracking-[0.1em] uppercase px-5 py-2 rounded-md transition-all hover:bg-white/10 hover:border-white/60"
            style={{ border: "1px solid #56565a", color: "#ffffff" }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] md:min-h-[88vh] overflow-hidden" style={{ background: "#1f1f21" }}>
        {/* Left — text */}
        <div className="flex flex-col justify-center px-10 pb-10 pt-10 w-full md:w-1/2 relative z-10">
          {/* Subtle gradient overlay behind the text */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f1f21] to-transparent pointer-events-none" />
          <p className="relative text-[11px] font-medium tracking-[0.2em] uppercase mb-6" style={{ color: "#8e8e93" }}>
            Document Editor — 2026
          </p>
          <h1 className="relative text-[40px] sm:text-[56px] md:text-[72px] font-bold leading-[0.95] tracking-[-3px] mb-6 uppercase" style={{ color: "#ffffff" }}>
            Write<br />Without<br />Limits
          </h1>
          <p className="relative text-[14px] leading-relaxed mb-10 max-w-sm md:max-w-xs" style={{ color: "#aeaeb2" }}>
            A professional document editor built for teams who care about craft. Rich editing, real-time collaboration, auto-save.
          </p>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href="/sign-up"
              className="text-[12px] font-bold tracking-[0.12em] uppercase px-8 py-3.5 rounded-md transition-all hover:opacity-90"
              style={{ background: "#ffffff", color: "#000000" }}
            >
              Start Writing Free
            </Link>
            <Link href="/sign-in"
              className="text-[12px] font-medium tracking-[0.1em] uppercase px-8 py-3.5 rounded-md transition-all hover:border-white hover:text-white"
              style={{ border: "1px solid #56565a", color: "#aeaeb2" }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Right — app screenshot, full width, no overlay card */}
        <div className="hidden md:flex flex-col w-1/2 relative" style={{ borderLeft: "1px solid #3a3a3c" }}>
          <div className="flex-1 flex items-center justify-center py-8 px-4 overflow-hidden" style={{ background: "#2c2c2e" }}>
            <AppScreenshot />
          </div>
        </div>
      </section>

      {/* ── Divider with stat strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:flex md:items-stretch border-y" style={{ borderColor: "#dedad6", background: "#ffffff" }}>
        {[
          { num: "9+",    label: "Formatting tools" },
          { num: "∞",     label: "Documents"        },
          { num: "Live",  label: "Collaboration"    },
          { num: "0₹",    label: "Forever free"     },
        ].map(({ num, label }, i) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-center py-8 gap-1"
            style={{ borderLeft: i > 0 ? "1px solid #dedad6" : undefined }}>
            <span className="text-[28px] font-bold tracking-[-1px]" style={{ color: "#1c1c1e" }}>{num}</span>
            <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#9e9c98" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 md:px-10 py-24 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between mb-16 border-b pb-8" style={{ borderColor: "#dedad6" }}>
          <h2 className="text-[42px] font-bold tracking-[-2px] uppercase leading-none" style={{ color: "#1c1c1e" }}>
            Every tool<br />you need
          </h2>
          <p className="text-[13px] max-w-xs text-left md:text-right" style={{ color: "#6e6c68" }}>
            Built for professionals who don't want to compromise on their writing tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px rounded-lg overflow-hidden" style={{ background: "#dedad6" }}>
          {FEATURES.map(({ icon, title, desc }, i) => (
            <div key={title} className="p-8 flex flex-col gap-4 group transition-colors hover:bg-[#eceae6]"
              style={{ background: "#f0eeeb" }}>
              <div className="w-8 h-8 flex items-center justify-center rounded-sm bg-[#e8e5e1] p-2" style={{ color: "#1c1c1e" }}>
                {icon}
              </div>
              <div>
                <h3 className="text-[14px] font-bold tracking-[-0.2px] mb-2 uppercase" style={{ color: "#1c1c1e" }}>{title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: "#6e6c68" }}>{desc}</p>
              </div>
              <div className="mt-auto pt-4 border-t text-[10px] font-bold tracking-[0.15em] uppercase transition-colors group-hover:text-[#1c1c1e]"
                style={{ borderColor: "#dedad6", color: "#9e9c98" }}>
                Feature {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Templates ────────────────────────────────────────────────────── */}
      <section id="templates" className="border-t py-24" style={{ borderColor: "#dedad6", background: "#ffffff" }}>
        <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between mb-12">
            <h2 className="text-[42px] font-bold tracking-[-2px] uppercase leading-none" style={{ color: "#1c1c1e" }}>
              Start with<br />a template
            </h2>
            <Link href="/sign-up"
              className="self-start md:self-auto text-[11px] font-bold tracking-[0.15em] uppercase px-6 py-2.5 rounded-md transition-all hover:bg-[#f0eeeb]"
              style={{ border: "1px solid #c5c3be", color: "#1c1c1e" }}>
              Browse All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "#dedad6" }}>
            {TEMPLATES.map(({ label, lines }) => (
              <Link key={label} href="/sign-up"
                className="group flex flex-col p-8 transition-colors hover:bg-[#f8f7f4] hover:shadow-md"
                style={{ background: "#ffffff" }}>
                {/* Mini doc preview */}
                <div className="w-full mb-6 flex flex-col gap-2 py-6 px-5 rounded-lg border overflow-hidden" style={{ borderColor: "#dedad6", background: "#f5f4f0" }}>
                  {lines.map((w, idx) => (
                    <div key={idx} className="rounded-sm" style={{
                      height: idx === 0 ? 8 : 4,
                      width: `${w}%`,
                      background: idx === 0 ? "#9e9c98" : "#dedad6"
                    }} />
                  ))}
                </div>
                <p className="text-[12px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: "#1c1c1e" }}>{label}</p>
                <p className="text-[10px] tracking-[0.08em] uppercase transition-colors group-hover:text-[#1c1c1e]" style={{ color: "#9e9c98" }}>
                  Use template →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-b py-28 px-4 sm:px-6 md:px-10 text-center" style={{ borderColor: "#dedad6", background: "#f5f4f0" }}>
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-6" style={{ color: "#9e9c98" }}>
          Ready to begin
        </p>
        <h2 className="text-[36px] sm:text-[56px] md:text-[72px] font-bold tracking-[-3px] uppercase leading-none mb-8" style={{ color: "#1c1c1e" }}>
          Start Writing<br />Today
        </h2>
        <Link href="/sign-up"
          className="inline-flex items-center gap-3 text-[13px] font-bold tracking-[0.15em] uppercase px-10 py-4 rounded-md transition-all hover:opacity-90"
          style={{ background: "#1c1c1e", color: "#ffffff" }}>
          Create Free Account
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="flex flex-col gap-3 sm:flex-row items-center justify-between px-10 py-8" style={{ borderTop: "1px solid #dedad6", background: "#ffffff" }}>
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="6" fill="#1c1c1e" />
            <rect x="8" y="9" width="14" height="2.5" rx="1.25" fill="white" />
            <rect x="8" y="15" width="20" height="2.5" rx="1.25" fill="white" />
            <rect x="8" y="21" width="16" height="2.5" rx="1.25" fill="white" />
            <rect x="8" y="27" width="11" height="2.5" rx="1.25" fill="white" />
          </svg>
          <span className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: "#1c1c1e" }}>FOLIO</span>
        </div>
        <p className="text-[11px] tracking-[0.05em]" style={{ color: "#9e9c98" }}>
          Built with Next.js · Clerk · Neon · Drizzle
        </p>
      </footer>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: "Rich Text Editing",
    desc: "Bold, italic, headings, lists, tables, images — everything a professional writer needs.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    title: "Auto-Save",
    desc: "Every keystroke saved automatically. A cloud indicator shows you exactly when your work is safe.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  },
  {
    title: "Real-Time Collaboration",
    desc: "Multiple people, one document. Live cursors, presence indicators, conflict-free merging.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    title: "Margin Ruler",
    desc: "Drag handles to set precise page margins — exactly like a real word processor.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  },
  {
    title: "Tables & Task Lists",
    desc: "Resizable tables with drag handles. Nested task lists with checkboxes for project planning.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  },
  {
    title: "Highlighter Pen",
    desc: "Drag to paint highlights across text like a real marker. Six preset colors plus custom.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  },
  {
    title: "Font & Color Controls",
    desc: "Full font family, size, text color, and highlight pickers. 32-color palette built in.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  },
  {
    title: "Image Support",
    desc: "Upload from disk or paste a URL. Resize with handles, align left, center, or right.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  },
  {
    title: "Keyboard Shortcuts",
    desc: "Full shortcut support — ⌘B, ⌘I, ⌘Z, ⌘Y and every standard command works as expected.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>,
  },
];

const TEMPLATES = [
  { label: "Blank Document", lines: [40, 75, 65, 80, 55, 70, 60] },
  { label: "Resume",         lines: [60, 90, 45, 80, 50, 75, 65] },
  { label: "Meeting Notes",  lines: [70, 60, 85, 50, 70, 60, 80] },
  { label: "Project Plan",   lines: [55, 80, 65, 90, 45, 70, 60] },
];

// ── App screenshot — matches the real editor's light-canvas look ──────────────

function AppScreenshot() {
  return (
    <div className="w-full mx-4 rounded-lg overflow-hidden shadow-2xl"
      style={{ border: "1px solid #3a3a3c", background: "#1c1c1e" }}>

      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: "#1c1c1e", borderColor: "#3a3a3c" }}>
        <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        <div className="flex-1 mx-4 h-5 rounded-md flex items-center justify-center text-[9px]"
          style={{ background: "#2c2c2e", color: "#6e6e73" }}>
          folio.app/documents/untitled
        </div>
      </div>

      {/* App navbar — dark chrome */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "#2c2c2e", borderColor: "#3a3a3c" }}>
        <div className="flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="6" fill="white" />
            <rect x="8" y="9" width="14" height="2.5" rx="1.25" fill="black" />
            <rect x="8" y="15" width="20" height="2.5" rx="1.25" fill="black" />
            <rect x="8" y="21" width="16" height="2.5" rx="1.25" fill="black" />
            <rect x="8" y="27" width="11" height="2.5" rx="1.25" fill="black" />
          </svg>
          <div className="h-2.5 w-16 rounded-sm" style={{ background: "#ffffff", opacity: 0.85 }} />
        </div>
        <div className="flex items-center gap-1.5">
          {["File","Edit","Insert","Format"].map(m => (
            <div key={m} className="h-2 w-6 rounded-sm" style={{ background: "#56565a" }} />
          ))}
        </div>
        <div className="w-6 h-6 rounded-full" style={{ background: "#636366" }} />
      </div>

      {/* Toolbar — dark strip with light pill */}
      <div className="flex items-center gap-1 px-3 py-2 border-b" style={{ background: "#2c2c2e", borderColor: "#3a3a3c" }}>
        <div className="flex items-center gap-1 px-2 py-1 rounded-2xl flex-1" style={{ background: "#f1f4f9" }}>
          <div className="h-4 w-20 rounded-sm" style={{ background: "#d1d1d6" }} />
          <div className="w-px h-3 mx-1" style={{ background: "#c7c7cc" }} />
          <div className="h-4 w-8 rounded-sm" style={{ background: "#d1d1d6" }} />
          <div className="w-px h-3 mx-1" style={{ background: "#c7c7cc" }} />
          {["B","I","U"].map(l => (
            <div key={l} className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold"
              style={{ background: l === "B" ? "#e5e5ea" : "transparent", color: "#3c3c43" }}>
              {l}
            </div>
          ))}
          <div className="w-px h-3 mx-1" style={{ background: "#c7c7cc" }} />
          {[0,1,2,3].map(i => (
            <div key={i} className="w-5 h-5 rounded-sm" style={{ background: "#e5e5ea" }} />
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[8px]" style={{ color: "#30d158" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#30d158" }} />
            Saved
          </div>
        </div>
      </div>

      {/* Ruler — light, matching real editor */}
      <div className="h-4 border-b relative overflow-hidden" style={{ background: "#e8e6e1", borderColor: "#c5c3be" }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, #c5c3be 0, #c5c3be 1px, transparent 0, transparent 48px)" }} />
        <div className="absolute left-12 top-0 bottom-0 w-px" style={{ background: "#d4d2cd" }} />
        <div className="absolute right-12 top-0 bottom-0 w-px" style={{ background: "#d4d2cd" }} />
      </div>

      {/* Canvas — warm light surround + white page with shadow */}
      <div className="flex justify-center py-5 px-5" style={{ background: "#e8e6e1", minHeight: 240 }}>
        <div className="w-full max-w-sm p-6 flex flex-col gap-2.5 rounded-md"
          style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.10), 0 4px 18px rgba(0,0,0,0.07)" }}>
          {/* Heading */}
          <div className="h-4 w-40 rounded-sm" style={{ background: "#1c1c1e", opacity: 0.8 }} />
          {/* Body lines */}
          {[92, 84, 76, 88, 60].map((w, i) => (
            <div key={i} className="h-1.5 rounded-sm" style={{
              width: `${w}%`,
              background: i === 2 ? "#ffd60a80" : "#d1d1d6"
            }} />
          ))}
          {/* Sub-heading */}
          <div className="mt-2 h-3 w-24 rounded-sm" style={{ background: "#48484a", opacity: 0.5 }} />
          {[88, 72].map((w, i) => (
            <div key={i} className="h-1.5 rounded-sm" style={{ width: `${w}%`, background: "#d1d1d6" }} />
          ))}
          {/* Mini table */}
          <div className="mt-2 rounded-sm overflow-hidden border" style={{ borderColor: "#c7c7cc" }}>
            <div className="grid grid-cols-3">
              {["Name","Role","Status"].map(h => (
                <div key={h} className="px-2 py-1 text-[7px] font-bold"
                  style={{ background: "#e5e5ea", color: "#48484a", borderRight: "1px solid #c7c7cc" }}>{h}</div>
              ))}
              {[["Alice","Eng","Active"],["Bob","Design","Review"]].map((row, ri) =>
                row.map((cell, ci) => (
                  <div key={`${ri}-${ci}`} className="px-2 py-1 text-[7px]"
                    style={{ background: ri % 2 === 0 ? "#ffffff" : "#f9f9fb", color: "#636366", borderTop: "1px solid #e5e5ea", borderRight: "1px solid #c7c7cc" }}>
                    {cell}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
