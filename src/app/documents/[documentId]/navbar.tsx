"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";
import { UserButton } from "@clerk/nextjs";
import { useEditorStore } from "@/store/use-editor-store";
import { useCollaborationContext } from "@/components/collaboration/collaboration-context";
import { ActiveUsers } from "@/components/collaboration/active-users";
import { ConnectionStatus } from "@/components/collaboration/connection-status";
import { ShareDialog } from "@/components/collaboration/share-dialog";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  type IParagraphOptions,
} from "docx";

// ── Icons ─────────────────────────────────────────────────────────────────────

const FolioLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Folio">
    <rect width="32" height="32" rx="6" fill="white" />
    <rect x="7" y="8" width="12" height="2" rx="1" fill="black" />
    <rect x="7" y="13" width="18" height="2" rx="1" fill="black" />
    <rect x="7" y="18" width="14" height="2" rx="1" fill="black" />
    <rect x="7" y="23" width="10" height="2" rx="1" fill="black" />
  </svg>
);

const CloudSyncIcon = ({ saved }: { saved: boolean }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={saved ? "#8e8e93" : "#f5a623"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className="transition-colors duration-300"
    aria-label={saved ? "All changes saved" : "Saving…"}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    {!saved && <path d="M12 13v4M10 15l2-2 2 2" strokeOpacity="0.7" />}
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? "#f5a623" : "none"}
    stroke={filled ? "#f5a623" : "#8e8e93"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

// ── Download helpers ──────────────────────────────────────────────────────────

/** Strip all HTML tags, decode entities */
function htmlToPlainText(html: string): string {
  const div = globalThis.document?.createElement("div");
  if (!div) return html;
  div.innerHTML = html;
  return div.innerText ?? div.textContent ?? "";
}

/** Download plain text */
function downloadTxt(html: string, filename: string) {
  const text = htmlToPlainText(html);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${filename}.txt`);
}

/** Download as HTML file */
function downloadHtml(html: string, filename: string) {
  const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${filename}</title>
  <style>
    body { font-family: "Times New Roman", serif; max-width: 816px; margin: 40px auto; padding: 0 56px; line-height: 1.6; }
    h1,h2,h3,h4,h5,h6 { margin-top: 1.2em; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 6px 10px; }
    ul, ol { padding-left: 1.5em; }
  </style>
</head>
<body>${html}</body>
</html>`;
  const blob = new Blob([full], { type: "text/html;charset=utf-8" });
  saveAs(blob, `${filename}.html`);
}

/** Download as .folio (native JSON format — full fidelity) */
function downloadFolio(jsonContent: object, filename: string) {
  const blob = new Blob([JSON.stringify(jsonContent, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  saveAs(blob, `${filename}.folio`);
}

/** Download as PDF using browser print — closes any open menus first */
function downloadPdf() {
  // Let Radix close the open menu, then give the browser one frame to
  // remove the portal from the DOM before print captures the layout.
  setTimeout(() => {
    window.print();
  }, 150);
}

/**
 * Convert TipTap HTML → docx paragraphs (best-effort mapping).
 * Handles: h1-h6, p, ul/ol li, bold, italic, underline, plain text.
 */
function htmlToDocxParagraphs(html: string): Paragraph[] {
  const div = globalThis.document?.createElement("div");
  if (!div) return [new Paragraph({ text: htmlToPlainText(html) })];
  div.innerHTML = html;

  const paragraphs: Paragraph[] = [];

  const HEADING_MAP: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
    H1: HeadingLevel.HEADING_1,
    H2: HeadingLevel.HEADING_2,
    H3: HeadingLevel.HEADING_3,
    H4: HeadingLevel.HEADING_4,
    H5: HeadingLevel.HEADING_5,
    H6: HeadingLevel.HEADING_6,
  };

  /** Walk a single DOM element and extract TextRuns */
  function extractRuns(el: Element | ChildNode): TextRun[] {
    const runs: TextRun[] = [];
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        if (text) runs.push(new TextRun({ text }));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = (child as Element).tagName?.toUpperCase();
        const childRuns = extractRuns(child);
        if (tag === "STRONG" || tag === "B") {
          childRuns.forEach((r) => {
            runs.push(new TextRun({ ...r, bold: true }));
          });
        } else if (tag === "EM" || tag === "I") {
          childRuns.forEach((r) => {
            runs.push(new TextRun({ ...r, italics: true }));
          });
        } else if (tag === "U") {
          childRuns.forEach((r) => {
            runs.push(new TextRun({ ...r, underline: {} }));
          });
        } else if (tag === "BR") {
          runs.push(new TextRun({ text: "", break: 1 }));
        } else {
          runs.push(...childRuns);
        }
      }
    });
    return runs;
  }

  /** Walk top-level nodes */
  function processNode(node: ChildNode) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    if (HEADING_MAP[tag]) {
      paragraphs.push(
        new Paragraph({
          heading: HEADING_MAP[tag],
          children: extractRuns(el),
        })
      );
    } else if (tag === "UL" || tag === "OL") {
      const isOrdered = tag === "OL";
      el.querySelectorAll("li").forEach((li) => {
        paragraphs.push(
          new Paragraph({
            bullet: isOrdered ? undefined : { level: 0 },
            numbering: isOrdered ? { reference: "default-numbering", level: 0 } : undefined,
            children: extractRuns(li),
          } as IParagraphOptions)
        );
      });
    } else if (tag === "P" || tag === "DIV") {
      const textAlign = (el as HTMLElement).style?.textAlign;
      const alignMap: Record<string, typeof AlignmentType[keyof typeof AlignmentType]> = {
        center: AlignmentType.CENTER,
        right: AlignmentType.RIGHT,
        justify: AlignmentType.JUSTIFIED,
        left: AlignmentType.LEFT,
      };
      paragraphs.push(
        new Paragraph({
          alignment: alignMap[textAlign] ?? AlignmentType.LEFT,
          children: extractRuns(el),
        })
      );
    } else if (tag === "TABLE") {
      // Table: flatten each row as a tab-separated paragraph (simplified)
      el.querySelectorAll("tr").forEach((tr) => {
        const cells: string[] = [];
        tr.querySelectorAll("td, th").forEach((cell) => {
          cells.push(cell.textContent?.trim() ?? "");
        });
        paragraphs.push(new Paragraph({ text: cells.join("\t") }));
      });
    } else {
      // Fallback: treat as paragraph
      const runs = extractRuns(el);
      if (runs.length) paragraphs.push(new Paragraph({ children: runs }));
    }
  }

  div.childNodes.forEach(processNode);

  return paragraphs.length ? paragraphs : [new Paragraph({ text: "" })];
}

async function downloadDocx(html: string, title: string) {
  const paragraphs = htmlToDocxParagraphs(html);
  const doc = new Document({
    title,
    description: "Created with Folio",
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
}

// ── Editable document title ───────────────────────────────────────────────────

interface DocumentTitleProps {
  documentId: string;
  initialTitle: string;
}

const DocumentTitle = ({ documentId, initialTitle }: DocumentTitleProps) => {
  const [title, setTitle] = useState(initialTitle || "Untitled Document");
  const [editing, setEditing] = useState(false);
  const { setIsSaved } = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const saveTitle = useCallback(async (value: string) => {
    const trimmed = value.trim() || "Untitled Document";
    setIsSaved(false);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      setIsSaved(true);
    } catch { /* retry later */ }
  }, [documentId, setIsSaved]);

  const commit = () => {
    setEditing(false);
    const trimmed = title.trim() || "Untitled Document";
    setTitle(trimmed);
    saveTitle(trimmed);
  };

  return editing ? (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commit(); }}
      className="text-[14px] font-medium tracking-[-0.1px] bg-transparent border-b-2 border-[#56565a] outline-none px-0.5 min-w-0 w-auto max-w-[140px] sm:max-w-xs"
      style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "#ffffff", width: `${Math.max(title.length, 8)}ch` }}
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      className="text-[14px] font-medium tracking-[-0.1px] cursor-text hover:bg-white/10 rounded px-1 py-0.5 transition-colors max-w-[140px] sm:max-w-xs truncate inline-block"
      style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "#ffffff" }}
    >
      {title}
    </span>
  );
};

// ── Menu bar (File / Edit / Insert / Format) ──────────────────────────────────

interface DocumentMenubarProps {
  documentTitle: string;
}

const DocumentMenubar = ({ documentTitle }: DocumentMenubarProps) => {
  const { editor } = useEditorStore();

  const getHtml = () => editor?.getHTML() ?? "";
  const getJson = () => editor?.getJSON() ?? {};
  const safeName = documentTitle.replace(/[^a-z0-9_\-\s]/gi, "").trim() || "document";

  return (
    <Menubar className="border-none bg-transparent shadow-none h-auto p-0 gap-0">

      {/* ── File ── */}
      <MenubarMenu>
        <MenubarTrigger className="text-[13px] font-normal tracking-[-0.1px] text-[#aeaeb2] px-2 py-0.5 rounded hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
          File
        </MenubarTrigger>
        <MenubarContent className="min-w-52">

          {/* Print / PDF */}
          <MenubarItem onClick={downloadPdf}>
            Print / Save as PDF <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>

          <MenubarSeparator />

          {/* Download submenu */}
          <MenubarSub>
            <MenubarSubTrigger>Download as</MenubarSubTrigger>
            <MenubarSubContent className="min-w-48">

              <MenubarItem onClick={() => downloadPdf()}>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-red-500 w-12 shrink-0">PDF</span>
                  PDF Document (.pdf)
                </span>
              </MenubarItem>

              <MenubarItem onClick={() => downloadDocx(getHtml(), safeName)}>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-500 w-12 shrink-0">DOCX</span>
                  Word Document (.docx)
                </span>
              </MenubarItem>

              <MenubarItem onClick={() => downloadHtml(getHtml(), safeName)}>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-orange-500 w-12 shrink-0">HTML</span>
                  Web Page (.html)
                </span>
              </MenubarItem>

              <MenubarItem onClick={() => downloadTxt(getHtml(), safeName)}>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-400 w-12 shrink-0">TXT</span>
                  Plain Text (.txt)
                </span>
              </MenubarItem>

              <MenubarSeparator />

              <MenubarItem onClick={() => downloadFolio(getJson(), safeName)}>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-purple-500 w-12 shrink-0">FOLIO</span>
                  Folio Format (.folio)
                </span>
              </MenubarItem>

            </MenubarSubContent>
          </MenubarSub>

          <MenubarSeparator />
          <MenubarItem onClick={() => window.print()}>
            Print
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* ── Edit ── */}
      <MenubarMenu>
        <MenubarTrigger className="text-[13px] font-normal tracking-[-0.1px] text-[#aeaeb2] px-2 py-0.5 rounded hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
          Edit
        </MenubarTrigger>
        <MenubarContent className="min-w-48">
          <MenubarItem onClick={() => editor?.chain().focus().undo().run()}>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => editor?.chain().focus().redo().run()}>
            Redo <MenubarShortcut>⌘Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => document.execCommand("cut")}>
            Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => document.execCommand("copy")}>
            Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => document.execCommand("paste")}>
            Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => editor?.chain().focus().selectAll().run()}>
            Select All <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* ── Insert ── */}
      <MenubarMenu>
        <MenubarTrigger className="hidden sm:block text-[13px] font-normal tracking-[-0.1px] text-[#aeaeb2] px-2 py-0.5 rounded hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
          Insert
        </MenubarTrigger>
        <MenubarContent className="min-w-48">
          <MenubarItem onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            Table
          </MenubarItem>
          <MenubarItem onClick={() => editor?.chain().focus().setImage({ src: "" }).run()}>
            Image
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
            Horizontal Rule
          </MenubarItem>
          <MenubarItem onClick={() => editor?.chain().focus().toggleTaskList().run()}>
            Task List
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* ── Format ── */}
      <MenubarMenu>
        <MenubarTrigger className="hidden sm:block text-[13px] font-normal tracking-[-0.1px] text-[#aeaeb2] px-2 py-0.5 rounded hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
          Format
        </MenubarTrigger>
        <MenubarContent className="min-w-48">
          <MenubarItem onClick={() => editor?.chain().focus().toggleBold().run()}>
            Bold <MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => editor?.chain().focus().toggleItalic().run()}>
            Italic <MenubarShortcut>⌘I</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => editor?.chain().focus().toggleUnderline?.()?.run()}>
            Underline <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Text alignment</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("left").run()}>Left</MenubarItem>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("center").run()}>Center</MenubarItem>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("right").run()}>Right</MenubarItem>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("justify").run()}>Justify</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem onClick={() => editor?.chain().focus().unsetAllMarks().run()}>
            Clear formatting
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

    </Menubar>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────

interface NavbarProps {
  documentId: string;
  initialTitle: string;
  isOwner: boolean;
}

export const Navbar = ({ documentId, initialTitle, isOwner }: NavbarProps) => {
  const { isSaved, currentPage, totalPages } = useEditorStore();
  const { isConnected, isSynced, activeUsers } = useCollaborationContext();
  const [starred, setStarred] = useState(false);
  const [titleForMenu, setTitleForMenu] = useState(initialTitle || "Untitled Document");

  // Keep menu title in sync when the DocumentTitle component commits a rename
  // We piggyback on the DOM title element to avoid prop-drilling
  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (document.title) setTitleForMenu(document.title);
    });
    obs.observe(document.querySelector("title") ?? document.head, {
      subtree: true, characterData: true, childList: true,
    });
    return () => obs.disconnect();
  }, []);

  const toggleStar = useCallback(async () => {
    const next = !starred;
    setStarred(next);
    // Persist to DB (add starred field to your schema if you want it server-side)
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: next }),
      });
    } catch { /* non-critical */ }
  }, [starred, documentId]);

  return (
    <nav className="flex items-start gap-3 px-2 sm:px-3 pt-2 pb-0.5 select-none print:hidden border-b"
      style={{ background: "#2c2c2e", borderColor: "#3a3a3c" }}>

      {/* Logo */}
      <div className="flex items-center shrink-0 mt-1">
        <FolioLogo />
      </div>

      {/* Title + menu col */}
      <div className="flex flex-col min-w-0 flex-1">
        {/* Row 1: title + action icons */}
        <div className="flex items-center gap-1 h-8">
          <DocumentTitle
            documentId={documentId}
            initialTitle={initialTitle}
          />
          {/* Star button — toggles filled/empty */}
          <button
            onClick={toggleStar}
            className="hidden sm:block p-1 rounded hover:bg-white/10 transition-colors"
            title={starred ? "Remove from starred" : "Add to starred"}
          >
            <StarIcon filled={starred} />
          </button>
          {/* Folder button — opens documents list */}
          <a
            href="/documents"
            className="hidden sm:block p-1 rounded hover:bg-white/10 transition-colors"
            title="All documents"
          >
            <FolderIcon />
          </a>
          <CloudSyncIcon saved={isSaved} />
        </div>

        {/* Row 2: menubar — pass current title for download filenames */}
        <div className="flex items-center -ml-2">
          <DocumentMenubar documentTitle={titleForMenu} />
        </div>
      </div>

      {/* Center: page counter */}
      <div className="hidden sm:flex items-center self-center shrink-0">
        <span className="text-[12px] text-[#8e8e93] tabular-nums select-none">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Right side: collaboration status + share + user avatar */}
      <div className="flex items-center gap-2 mt-1 shrink-0">
        {/* Other active collaborators */}
        <ActiveUsers
          users={activeUsers}
          className="hidden sm:flex"
        />
        {/* Connection/sync status */}
        <ConnectionStatus
          isConnected={isConnected}
          isSynced={isSynced}
          className="hidden sm:flex text-xs py-1 px-2"
        />
        {/* Share button */}
        <ShareDialog
          documentId={documentId}
          documentTitle={titleForMenu}
          isOwner={isOwner}
        />
        {/* User avatar */}
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
      </div>
    </nav>
  );
};
