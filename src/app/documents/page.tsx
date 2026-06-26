"use client";

import { useState } from "react";
import Link from "next/link";

// ── Icons ─────────────────────────────────────────────────────────────────────

const FolioLogo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#1a73e8" />
    <rect x="8" y="9"  width="14" height="2.5" rx="1.25" fill="white" />
    <rect x="8" y="15" width="20" height="2.5" rx="1.25" fill="white" />
    <rect x="8" y="21" width="16" height="2.5" rx="1.25" fill="white" />
    <rect x="8" y="27" width="11" height="2.5" rx="1.25" fill="white" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7.5" />
    <line x1="20.5" y1="20.5" x2="16.2" y2="16.2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const GridViewIcon = ({ active }: { active: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? "#1a73e8" : "#80868b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ListViewIcon = ({ active }: { active: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? "#1a73e8" : "#80868b"} strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" fill={active ? "#1a73e8" : "#80868b"} stroke="none" />
    <circle cx="4" cy="12" r="1" fill={active ? "#1a73e8" : "#80868b"} stroke="none" />
    <circle cx="4" cy="18" r="1" fill={active ? "#1a73e8" : "#80868b"} stroke="none" />
  </svg>
);

const DotsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#80868b">
    <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14.5" />
  </svg>
);

const DocFileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="2" width="18" height="24" rx="2" fill="#e8f0fe" />
    <path d="M18 2l6 6h-4a2 2 0 0 1-2-2V2z" fill="#c5d8fc" />
    <rect x="8" y="12" width="10" height="1.5" rx="0.75" fill="#4285f4" opacity="0.6" />
    <rect x="8" y="16" width="12" height="1.5" rx="0.75" fill="#4285f4" opacity="0.4" />
    <rect x="8" y="20" width="8"  height="1.5" rx="0.75" fill="#4285f4" opacity="0.4" />
  </svg>
);

// ── Template SVG previews ─────────────────────────────────────────────────────

const BlankTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="12" y="18" width="40" height="5" rx="2" fill="#e8eaed" />
    {[28,34,40,46,52,58].map((y,i) => (
      <rect key={i} x="12" y={y} width={[76,65,70,50,72,60][i]} height="3" rx="1.5" fill="#f1f3f4" />
    ))}
  </svg>
);

const ResumeTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="0" y="0" width="100" height="30" fill="#1a73e8" />
    <circle cx="18" cy="15" r="9" fill="white" opacity="0.3" />
    <rect x="32" y="8" width="36" height="5" rx="2" fill="white" opacity="0.9" />
    <rect x="32" y="17" width="24" height="3" rx="1.5" fill="white" opacity="0.6" />
    <rect x="12" y="38" width="22" height="3" rx="1.5" fill="#1a73e8" opacity="0.8" />
    <rect x="12" y="44" width="76" height="0.75" rx="0.375" fill="#e0e0e0" />
    {[48,53,58].map((y,i)=><rect key={i} x="12" y={y} width={[70,60,65][i]} height="2.5" rx="1.25" fill="#bdc1c6" />)}
    <rect x="12" y="72" width="22" height="3" rx="1.5" fill="#1a73e8" opacity="0.8" />
    <rect x="12" y="78" width="76" height="0.75" rx="0.375" fill="#e0e0e0" />
    {[82,87,92].map((y,i)=><rect key={i} x="12" y={y} width={[76,55,68][i]} height="2.5" rx="1.25" fill="#bdc1c6" />)}
  </svg>
);

const LetterTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="12" y="10" width="20" height="6" rx="1.5" fill="#1a73e8" opacity="0.8" />
    <rect x="12" y="20" width="40" height="2.5" rx="1.25" fill="#e0e0e0" />
    <rect x="12" y="24" width="32" height="2.5" rx="1.25" fill="#e0e0e0" />
    <rect x="12" y="36" width="28" height="2.5" rx="1.25" fill="#bdc1c6" />
    <rect x="12" y="40" width="22" height="2.5" rx="1.25" fill="#bdc1c6" />
    {[50,55,60,65,70,75,80].map((y,i)=>(
      <rect key={i} x="12" y={y} width={[76,70,76,55,76,65,44][i]} height="2.5" rx="1.25" fill="#e0e0e0" />
    ))}
    <rect x="12" y="96"  width="24" height="2.5" rx="1.25" fill="#bdc1c6" />
    <rect x="12" y="101" width="18" height="2.5" rx="1.25" fill="#bdc1c6" />
  </svg>
);

const MeetingTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="10" y="10" width="80" height="16" rx="3" fill="#e8f0fe" />
    <rect x="16" y="14" width="44" height="4" rx="2" fill="#1a73e8" opacity="0.7" />
    <rect x="16" y="20" width="28" height="2.5" rx="1.25" fill="#9aa0a6" opacity="0.6" />
    {[34,44,54,64,74,84,94].map((y,i)=>(
      <g key={i}>
        <rect x="10" y={y} width="4" height="4" rx="1" fill="#1a73e8" opacity="0.3" />
        <rect x="18" y={y+0.5} width={[62,50,68,45,60,42,55][i]} height="3" rx="1.5" fill={i<3?"#bdc1c6":"#e0e0e0"} />
      </g>
    ))}
  </svg>
);

const ProjectTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="10" y="10" width="48" height="6" rx="2" fill="#202124" opacity="0.8" />
    <rect x="10" y="22" width="80" height="1" fill="#e0e0e0" />
    {/* Table header */}
    <rect x="10" y="26" width="80" height="12" rx="2" fill="#f8f9fa" />
    {[10,30,55].map((x,i)=><rect key={i} x={x+2} y={30} width={[16,22,28][i]} height="3" rx="1.5" fill="#9aa0a6" />)}
    {/* Rows */}
    {[42,56,70,84].map((y,i)=>(
      <g key={i}>
        <rect x="10" y={y} width="80" height="1" fill="#f1f3f4" />
        <rect x="12" y={y+4}  width="16" height="3" rx="1.5" fill="#bdc1c6" />
        <rect x="32" y={y+4}  width="22" height="3" rx="1.5" fill="#bdc1c6" />
        <rect x="57" y={y+3} width="28" height="5" rx="2.5" fill={["#e6f4ea","#fce8e6","#e8f0fe","#fef7e0"][i]} />
        <rect x="60" y={y+4.5} width={[18,16,20,12][i]} height="2" rx="1" fill={["#34a853","#ea4335","#1a73e8","#fbbc04"][i]} opacity="0.7" />
      </g>
    ))}
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────────

interface TemplateItem { id: string; label: string; Preview: React.FC }

const TEMPLATES: TemplateItem[] = [
  { id: "resume",   label: "Resume",        Preview: ResumeTemplateSVG  },
  { id: "letter",   label: "Cover Letter",  Preview: LetterTemplateSVG  },
  { id: "meeting",  label: "Meeting Notes", Preview: MeetingTemplateSVG },
  { id: "project",  label: "Project Plan",  Preview: ProjectTemplateSVG },
];

interface Doc { id: string; title: string; modified: string; color: string }

const DOCS: Doc[] = [
  { id: "doc-1", title: "Q3 Marketing Plan",            modified: "Jun 25, 2026", color: "#e8f0fe" },
  { id: "doc-2", title: "Product Roadmap 2026",          modified: "Jun 24, 2026", color: "#e6f4ea" },
  { id: "doc-3", title: "Meeting Notes – Design Review", modified: "Jun 23, 2026", color: "#fef7e0" },
  { id: "doc-4", title: "Untitled Document",             modified: "Jun 22, 2026", color: "#f8f9fa" },
  { id: "doc-5", title: "Sprint Planning – Week 26",     modified: "Jun 20, 2026", color: "#fce8e6" },
  { id: "doc-6", title: "Client Proposal Draft",         modified: "Jun 18, 2026", color: "#f3e8fd" },
  { id: "doc-7", title: "Brand Guidelines",              modified: "Jun 15, 2026", color: "#e8f0fe" },
  { id: "doc-8", title: "Onboarding Checklist",          modified: "Jun 12, 2026", color: "#e6f4ea" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [query,    setQuery]    = useState("");
  const [view,     setView]     = useState<"grid"|"list">("grid");
  const [showTpls, setShowTpls] = useState(true);

  const filtered = DOCS.filter(d => d.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center gap-4 px-5 h-[64px]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
          <FolioLogo />
          <span className="text-[20px] font-light tracking-[-0.3px]" style={{ color: "#5f6368" }}>
            Folio
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 mx-4 max-w-[640px]">
          <label className="flex items-center gap-3 rounded-2xl px-4 h-[46px] cursor-text transition-all"
            style={{ background: "#f1f3f4" }}
            onFocus={() => {}}
          >
            <SearchIcon />
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#9aa0a6]"
              style={{ color: "#202124" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[#9aa0a6] hover:text-[#5f6368] text-lg leading-none">×</button>
            )}
          </label>
        </div>

        {/* Avatar */}
        <div className="ml-auto shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4285f4, #1a73e8)" }}
          >
            U
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1100px] px-6 py-8">

        {/* ── Template gallery ─────────────────────────────────────────────── */}
        {!query && (
          <section className="mb-10">
            {/* Section head */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "#80868b", letterSpacing: "0.08em" }}>
                Start a new document
              </h2>
              <button
                onClick={() => setShowTpls(v => !v)}
                className="text-[13px] font-medium px-3 py-1 rounded-full transition-colors hover:bg-[#e8f0fe]"
                style={{ color: "#1a73e8" }}
              >
                {showTpls ? "Hide" : "Show templates"}
              </button>
            </div>

            {showTpls && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}
              >
                <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {/* Blank */}
                  <Link href="/documents/new" className="group shrink-0 flex flex-col items-center gap-2 cursor-pointer">
                    <div
                      className="w-[104px] rounded-xl border-2 border-dashed overflow-hidden transition-all duration-150 group-hover:border-[#1a73e8] group-hover:shadow-md"
                      style={{ aspectRatio: "3/4", borderColor: "#dadce0", background: "white" }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center transition-colors group-hover:bg-[#e8f0fe]"
                          style={{ background: "#f1f3f4" }}>
                          <PlusIcon />
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-medium text-[#3c4043] group-hover:text-[#1a73e8] transition-colors">Blank</span>
                  </Link>

                  {/* Templates */}
                  {TEMPLATES.map(({ id, label, Preview }) => (
                    <Link key={id} href={`/documents/${id}`}
                      className="group shrink-0 flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-[104px] rounded-xl border overflow-hidden transition-all duration-150 group-hover:border-[#1a73e8] group-hover:shadow-md"
                        style={{ aspectRatio: "3/4", borderColor: "#e0e0e0" }}
                      >
                        <Preview />
                      </div>
                      <span className="text-[12px] font-medium text-[#3c4043] group-hover:text-[#1a73e8] transition-colors text-center">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Recent docs ──────────────────────────────────────────────────── */}
        <section>
          {/* Head */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "#80868b", letterSpacing: "0.08em" }}>
              {query ? `Results for "${query}"` : "Recent documents"}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView("grid")}
                className="p-2 rounded-xl transition-colors"
                style={{ background: view === "grid" ? "#e8f0fe" : "transparent" }}
              >
                <GridViewIcon active={view === "grid"} />
              </button>
              <button
                onClick={() => setView("list")}
                className="p-2 rounded-xl transition-colors"
                style={{ background: view === "list" ? "#e8f0fe" : "transparent" }}
              >
                <ListViewIcon active={view === "list"} />
              </button>
            </div>
          </div>

          {/* Empty */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 gap-3" style={{ color: "#9aa0a6" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-[14px]">No documents found</p>
            </div>
          )}

          {/* Grid */}
          {view === "grid" && filtered.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))" }}>
              {filtered.map(doc => (
                <Link key={doc.id} href={`/documents/${doc.id}`}
                  className="group flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    background: "white",
                    borderColor: "#e0e0e0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")}
                >
                  {/* Thumbnail */}
                  <div className="relative flex flex-col p-5 gap-1.5 h-[148px]" style={{ background: doc.color }}>
                    {/* Simulated doc lines */}
                    <div className="h-2.5 w-3/5 rounded-sm" style={{ background: "rgba(0,0,0,0.12)" }} />
                    {[1,.75,.85,.6,.7].map((w,i) => (
                      <div key={i} className="h-1.5 rounded-sm" style={{ width: `${w*100}%`, background: "rgba(0,0,0,0.07)" }} />
                    ))}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors rounded-t-2xl" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2.5 px-3 py-3" style={{ borderTop: "1px solid #f1f3f4" }}>
                    <DocFileIcon />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate" style={{ color: "#202124" }}>{doc.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ClockIcon />
                        <span className="text-[11px]" style={{ color: "#9aa0a6" }}>{doc.modified}</span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                      className="p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:bg-[#f1f3f4]"
                    >
                      <DotsIcon />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* List */}
          {view === "list" && filtered.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ background: "white", borderColor: "#e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              {/* Table head */}
              <div className="grid px-4 py-2.5 text-[11.5px] font-semibold tracking-wide uppercase border-b"
                style={{ gridTemplateColumns: "auto 1fr 160px 80px 36px", color: "#80868b", borderColor: "#f1f3f4", letterSpacing:"0.07em" }}>
                <div className="w-9" />
                <div>Title</div>
                <div>Last modified</div>
                <div>Owner</div>
                <div />
              </div>

              {filtered.map((doc, i) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}
                  className="group grid items-center px-4 py-3 transition-colors hover:bg-[#f8f9fa] cursor-pointer"
                  style={{ gridTemplateColumns: "auto 1fr 160px 80px 36px", borderTop: i > 0 ? "1px solid #f1f3f4" : undefined }}
                >
                  <DocFileIcon />
                  <span className="text-[13.5px] font-medium pl-3 truncate" style={{ color: "#202124" }}>{doc.title}</span>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon />
                    <span className="text-[12.5px]" style={{ color: "#5f6368" }}>{doc.modified}</span>
                  </div>
                  <span className="text-[12.5px]" style={{ color: "#5f6368" }}>Me</span>
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    className="p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:bg-[#f1f3f4]"
                  >
                    <DotsIcon />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── FAB ────────────────────────────────────────────────────────────── */}
      <Link href="/documents/new"
        className="fixed bottom-7 right-7 z-30 flex items-center gap-2.5 h-14 pl-5 pr-6 rounded-2xl font-medium text-[14px] transition-all hover:-translate-y-0.5"
        style={{
          background: "#e8f0fe",
          color: "#1a73e8",
          boxShadow: "0 2px 10px rgba(26,115,232,0.25)",
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,115,232,0.35)")}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(26,115,232,0.25)")}
      >
        <PlusIcon />
        New document
      </Link>
    </div>
  );
}
