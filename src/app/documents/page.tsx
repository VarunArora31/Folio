"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { type Document } from "@/db/schema";

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
    <circle cx="11" cy="11" r="7.5" /><line x1="20.5" y1="20.5" x2="16.2" y2="16.2" />
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

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

// ── Template SVG previews ─────────────────────────────────────────────────────

const BlankTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="12" y="18" width="40" height="5" rx="2" fill="#e8eaed" />
    {[28,34,40,46,52,58].map((y,i) => (
      <rect key={i} x="12" y={y} width={[76,65,70,50,72,60][i]} height="3" rx="1.5" fill="#f1f3f4" />
    ))}
  </svg>
);

const ResumeTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" className="w-full h-full">
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
  <svg viewBox="0 0 100 130" fill="none" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="12" y="10" width="20" height="6" rx="1.5" fill="#1a73e8" opacity="0.8" />
    {[20,24].map((y,i)=><rect key={i} x="12" y={y} width={[40,32][i]} height="2.5" rx="1.25" fill="#e0e0e0" />)}
    {[36,40].map((y,i)=><rect key={i} x="12" y={y} width={[28,22][i]} height="2.5" rx="1.25" fill="#bdc1c6" />)}
    {[50,55,60,65,70,75,80].map((y,i)=>(
      <rect key={i} x="12" y={y} width={[76,70,76,55,76,65,44][i]} height="2.5" rx="1.25" fill="#e0e0e0" />
    ))}
  </svg>
);

const MeetingTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="10" y="10" width="80" height="16" rx="3" fill="#e8f0fe" />
    <rect x="16" y="14" width="44" height="4" rx="2" fill="#1a73e8" opacity="0.7" />
    {[34,44,54,64,74,84,94].map((y,i)=>(
      <g key={i}>
        <rect x="10" y={y} width="4" height="4" rx="1" fill="#1a73e8" opacity="0.3" />
        <rect x="18" y={y+0.5} width={[62,50,68,45,60,42,55][i]} height="3" rx="1.5" fill={i<3?"#bdc1c6":"#e0e0e0"} />
      </g>
    ))}
  </svg>
);

const ProjectTemplateSVG = () => (
  <svg viewBox="0 0 100 130" fill="none" className="w-full h-full">
    <rect width="100" height="130" fill="white" />
    <rect x="10" y="10" width="48" height="6" rx="2" fill="#202124" opacity="0.8" />
    <rect x="10" y="22" width="80" height="1" fill="#e0e0e0" />
    <rect x="10" y="26" width="80" height="12" rx="2" fill="#f8f9fa" />
    {[10,30,55].map((x,i)=><rect key={i} x={x+2} y={30} width={[16,22,28][i]} height="3" rx="1.5" fill="#9aa0a6" />)}
    {[42,56,70,84].map((y,i)=>(
      <g key={i}>
        <rect x="10" y={y} width="80" height="1" fill="#f1f3f4" />
        <rect x="12" y={y+4} width="16" height="3" rx="1.5" fill="#bdc1c6" />
        <rect x="32" y={y+4} width="22" height="3" rx="1.5" fill="#bdc1c6" />
        <rect x="57" y={y+3} width="28" height="5" rx="2.5" fill={["#e6f4ea","#fce8e6","#e8f0fe","#fef7e0"][i]} />
        <rect x="60" y={y+4.5} width={[18,16,20,12][i]} height="2" rx="1" fill={["#34a853","#ea4335","#1a73e8","#fbbc04"][i]} opacity="0.7" />
      </g>
    ))}
  </svg>
);

// ── Template data ─────────────────────────────────────────────────────────────

interface TemplateItem {
  id: string;
  label: string;
  Preview: React.FC;
  initialContent: string;
}

const TEMPLATES: TemplateItem[] = [
  { id: "blank",   label: "Blank",         Preview: BlankTemplateSVG,   initialContent: "" },
  { id: "resume",  label: "Resume",        Preview: ResumeTemplateSVG,  initialContent: "<h1>Your Name</h1><p>email@example.com</p><h2>Experience</h2><p></p><h2>Education</h2><p></p>" },
  { id: "letter",  label: "Cover Letter",  Preview: LetterTemplateSVG,  initialContent: "<p>Dear Hiring Manager,</p><p></p><p>Sincerely,<br>Your Name</p>" },
  { id: "meeting", label: "Meeting Notes", Preview: MeetingTemplateSVG, initialContent: "<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li><p></p></li></ul><h2>Action Items</h2><ul><li><p></p></li></ul>" },
  { id: "project", label: "Project Plan",  Preview: ProjectTemplateSVG, initialContent: "<h1>Project Plan</h1><p><strong>Owner:</strong> </p><p><strong>Due Date:</strong> </p><h2>Overview</h2><p></p><h2>Milestones</h2><p></p>" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const DOC_COLORS = ["#e8f0fe","#e6f4ea","#fef7e0","#f8f9fa","#fce8e6","#f3e8fd","#e8f0fe","#e6f4ea"];
const getColor = (id: string) => DOC_COLORS[id.charCodeAt(0) % DOC_COLORS.length];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firstName = user?.firstName || user?.username || "there";

  const [docs, setDocs]           = useState<Document[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [query, setQuery]         = useState("");
  const [view, setView]           = useState<"grid"|"list">("grid");
  const [showTpls, setShowTpls]   = useState(true);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  // ── Fetch documents ──────────────────────────────────────────────────────
  const fetchDocs = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (res.ok) setDocs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchDocs(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchDocs]);

  // ── Create document ──────────────────────────────────────────────────────
  const createDoc = async (templateId = "blank", title = "Untitled Document", initialContent = "") => {
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, templateId, initialContent }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/documents/${doc.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Delete document ──────────────────────────────────────────────────────
  const deleteDoc = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocs(prev => prev.filter(d => d.id !== id));
    setDeleteId(null);
  };

  const filtered = docs;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center gap-4 px-5 h-[64px]">
        <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
          <FolioLogo />
          <span className="text-[18px] font-medium tracking-[-0.3px]" style={{ color: "#3c4043" }}>Folio</span>
        </Link>
        <div className="flex-1 mx-4 max-w-[640px]">
          <label className="flex items-center gap-3 rounded-2xl px-4 h-[46px] cursor-text" style={{ background: "#f1f3f4" }}>
            <SearchIcon />
            <input type="text" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#9aa0a6]"
              style={{ color: "#202124" }} />
            {query && <button onClick={() => setQuery("")} className="text-[#9aa0a6] hover:text-[#5f6368] text-lg leading-none">×</button>}
          </label>
        </div>
        <div className="ml-auto shrink-0">
          <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-8">

        {/* ── Greeting ─────────────────────────────────────────────────── */}
        {!query && (
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-[-0.3px]" style={{ color: "#202124" }}>
              Good {getTimeOfDay()}, {firstName}
            </h1>
          </div>
        )}

        {/* ── Template gallery ─────────────────────────────────────────── */}
        {!query && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-medium" style={{ color: "#5f6368" }}>Start a new document</h2>
              <button onClick={() => setShowTpls(v => !v)}
                className="text-[13px] font-medium px-3 py-1 rounded-full transition-colors hover:bg-[#e8f0fe]"
                style={{ color: "#1a73e8" }}>
                {showTpls ? "Hide" : "Show templates"}
              </button>
            </div>
            {showTpls && (
              <div className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {TEMPLATES.map(({ id, label, Preview, initialContent }) => (
                    <button key={id} disabled={creating}
                      onClick={() => createDoc(id, id === "blank" ? "Untitled Document" : label, initialContent)}
                      className="group shrink-0 flex flex-col items-center gap-2 cursor-pointer disabled:opacity-60">
                      <div className="w-[104px] rounded-xl border overflow-hidden transition-all duration-150 group-hover:border-[#1a73e8] group-hover:shadow-md"
                        style={{ aspectRatio: "3/4", borderColor: "#e0e0e0", borderWidth: id === "blank" ? 2 : 1, borderStyle: id === "blank" ? "dashed" : "solid" }}>
                        {id === "blank"
                          ? <div className="w-full h-full flex items-center justify-center" style={{ background: "white" }}>
                              <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#e8f0fe]" style={{ background: "#f1f3f4" }}>
                                <PlusIcon />
                              </div>
                            </div>
                          : <Preview />}
                      </div>
                      <span className="text-[12px] font-medium text-[#3c4043] group-hover:text-[#1a73e8] transition-colors">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Recent docs ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium" style={{ color: "#5f6368" }}>
              {query ? `Results for "${query}"` : "Recent documents"}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setView("grid")} className="p-2 rounded-xl transition-colors"
                style={{ background: view === "grid" ? "#e8f0fe" : "transparent" }}>
                <GridViewIcon active={view === "grid"} />
              </button>
              <button onClick={() => setView("list")} className="p-2 rounded-xl transition-colors"
                style={{ background: view === "list" ? "#e8f0fe" : "transparent" }}>
                <ListViewIcon active={view === "list"} />
              </button>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border overflow-hidden animate-pulse" style={{ background: "white", borderColor: "#e0e0e0" }}>
                  <div className="h-[148px]" style={{ background: "#f1f3f4" }} />
                  <div className="px-3 py-3 flex gap-2">
                    <div className="w-7 h-7 rounded" style={{ background: "#e0e0e0" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded" style={{ background: "#e0e0e0", width: "80%" }} />
                      <div className="h-2.5 rounded" style={{ background: "#f1f3f4", width: "50%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-[14px] font-medium" style={{ color: "#80868b" }}>
                {query ? "No documents match your search" : "No documents yet — create one above"}
              </p>
            </div>
          )}

          {/* Grid view */}
          {!loading && filtered.length > 0 && view === "grid" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))" }}>
              {filtered.map(doc => (
                <div key={doc.id} className="group relative">
                  <Link href={`/documents/${doc.id}`}
                    className="flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                    style={{ background: "white", borderColor: "#e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")}>
                    <div className="relative flex flex-col p-5 gap-1.5 h-[148px]" style={{ background: getColor(doc.id) }}>
                      <div className="h-2.5 w-3/5 rounded-sm" style={{ background: "rgba(0,0,0,0.12)" }} />
                      {[1,.75,.85,.6,.7].map((w,i) => (
                        <div key={i} className="h-1.5 rounded-sm" style={{ width: `${w*100}%`, background: "rgba(0,0,0,0.07)" }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-3" style={{ borderTop: "1px solid #f1f3f4" }}>
                      <DocFileIcon />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium truncate" style={{ color: "#202124" }}>{doc.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ClockIcon />
                          <span className="text-[11px]" style={{ color: "#9aa0a6" }}>{formatDate(doc.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {/* Delete button */}
                  <button onClick={() => setDeleteId(doc.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    title="Delete">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {!loading && filtered.length > 0 && view === "list" && (
            <div className="rounded-2xl overflow-hidden border" style={{ background: "white", borderColor: "#e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="grid px-4 py-2.5 text-[11.5px] font-semibold border-b"
                style={{ gridTemplateColumns: "auto 1fr 160px 36px", color: "#80868b", borderColor: "#f1f3f4" }}>
                <div className="w-9" /><div>Title</div><div>Last modified</div><div />
              </div>
              {filtered.map((doc, i) => (
                <div key={doc.id} className="group grid items-center px-4 py-3 hover:bg-[#f8f9fa] transition-colors"
                  style={{ gridTemplateColumns: "auto 1fr 160px 36px", borderTop: i > 0 ? "1px solid #f1f3f4" : undefined }}>
                  <DocFileIcon />
                  <Link href={`/documents/${doc.id}`} className="text-[13.5px] font-medium pl-3 truncate hover:underline" style={{ color: "#202124" }}>
                    {doc.title}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon />
                    <span className="text-[12.5px]" style={{ color: "#5f6368" }}>{formatDate(doc.updatedAt)}</span>
                  </div>
                  <button onClick={() => setDeleteId(doc.id)}
                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-[360px] shadow-2xl">
            <h3 className="text-[15px] font-semibold mb-2" style={{ color: "#202124" }}>Delete document?</h3>
            <p className="text-[13px] mb-5" style={{ color: "#5f6368" }}>This document will be deleted. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium hover:bg-[#f1f3f4] transition-colors"
                style={{ color: "#5f6368" }}>Cancel</button>
              <button onClick={() => deleteDoc(deleteId)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-colors hover:opacity-90"
                style={{ background: "#ea4335" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <button disabled={creating} onClick={() => createDoc()}
        className="fixed bottom-7 right-7 z-30 flex items-center gap-2.5 h-14 pl-5 pr-6 rounded-2xl font-medium text-[14px] transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "#e8f0fe", color: "#1a73e8", boxShadow: "0 2px 10px rgba(26,115,232,0.25)" }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,115,232,0.35)")}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(26,115,232,0.25)")}>
        <PlusIcon />
        {creating ? "Creating…" : "New document"}
      </button>
    </div>
  );
}
