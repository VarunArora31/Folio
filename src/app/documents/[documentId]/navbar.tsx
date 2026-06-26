"use client";

import { useState, useRef, useEffect } from "react";
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
import { useEditorStore } from "@/store/use-editor-store";

// ── Minimal inline SVG icons (no lucide) ─────────────────────────────────────

const FolioLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Folio">
    <rect width="32" height="32" rx="6" fill="#4285F4" />
    <rect x="7" y="8" width="12" height="2" rx="1" fill="white" />
    <rect x="7" y="13" width="18" height="2" rx="1" fill="white" />
    <rect x="7" y="18" width="14" height="2" rx="1" fill="white" />
    <rect x="7" y="23" width="10" height="2" rx="1" fill="white" />
  </svg>
);

const CloudSyncIcon = ({ saved }: { saved: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={saved ? "#5f6368" : "#fbbc04"}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-colors duration-300"
    title={saved ? "All changes saved" : "Saving…"}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    {!saved && (
      <path d="M12 13v4M10 15l2-2 2 2" strokeOpacity="0.7" />
    )}
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

// ── Editable document title ───────────────────────────────────────────────────

const DocumentTitle = () => {
  const [title, setTitle] = useState("Untitled Document");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (!title.trim()) setTitle("Untitled Document");
  };

  return editing ? (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") commit();
      }}
      className="text-[15px] font-medium text-[#202124] bg-transparent border-b-2 border-[#4285F4] outline-none px-0.5 min-w-0 w-auto max-w-xs"
      style={{ width: `${Math.max(title.length, 8)}ch` }}
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      className="text-[15px] font-medium text-[#202124] cursor-text hover:bg-neutral-100 rounded px-1 py-0.5 transition-colors"
    >
      {title}
    </span>
  );
};

// ── Menu bar (File / Edit / Insert / Format) ──────────────────────────────────

const DocumentMenubar = () => {
  const { editor } = useEditorStore();

  return (
    <Menubar className="border-none bg-transparent shadow-none h-auto p-0 gap-0">
      {/* File */}
      <MenubarMenu>
        <MenubarTrigger className="text-[13px] text-[#3c4043] font-normal px-2 py-0.5 rounded hover:bg-neutral-100 data-[state=open]:bg-neutral-100">
          File
        </MenubarTrigger>
        <MenubarContent className="min-w-48">
          <MenubarItem onClick={() => window.print()}>
            Print <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Download
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Download as</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>PDF Document (.pdf)</MenubarItem>
              <MenubarItem>Plain Text (.txt)</MenubarItem>
              <MenubarItem>HTML (.html)</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>Share</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Edit */}
      <MenubarMenu>
        <MenubarTrigger className="text-[13px] text-[#3c4043] font-normal px-2 py-0.5 rounded hover:bg-neutral-100 data-[state=open]:bg-neutral-100">
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

      {/* Insert */}
      <MenubarMenu>
        <MenubarTrigger className="text-[13px] text-[#3c4043] font-normal px-2 py-0.5 rounded hover:bg-neutral-100 data-[state=open]:bg-neutral-100">
          Insert
        </MenubarTrigger>
        <MenubarContent className="min-w-48">
          <MenubarItem
            onClick={() =>
              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            Table
          </MenubarItem>
          <MenubarItem
            onClick={() =>
              editor?.chain().focus().setImage({ src: "" }).run()
            }
          >
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

      {/* Format */}
      <MenubarMenu>
        <MenubarTrigger className="text-[13px] text-[#3c4043] font-normal px-2 py-0.5 rounded hover:bg-neutral-100 data-[state=open]:bg-neutral-100">
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
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
                Left
              </MenubarItem>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
                Center
              </MenubarItem>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
                Right
              </MenubarItem>
              <MenubarItem onClick={() => editor?.chain().focus().setTextAlign("justify").run()}>
                Justify
              </MenubarItem>
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

export const Navbar = () => {
  // Simulate "saved" state — later wire to real save logic
  const [saved] = useState(true);

  return (
    <nav className="flex items-start gap-2 px-3 pt-2 pb-0.5 bg-white select-none print:hidden">
      {/* Logo */}
      <div className="flex items-center shrink-0 mt-0.5">
        <FolioLogo />
      </div>

      {/* Title + menu col */}
      <div className="flex flex-col min-w-0 flex-1">
        {/* Row 1: title + action icons */}
        <div className="flex items-center gap-1.5 h-8">
          <DocumentTitle />
          <button className="p-1 rounded hover:bg-neutral-100 transition-colors" title="Starred">
            <StarIcon />
          </button>
          <button className="p-1 rounded hover:bg-neutral-100 transition-colors" title="Move to folder">
            <FolderIcon />
          </button>
          <CloudSyncIcon saved={saved} />
        </div>

        {/* Row 2: menubar */}
        <div className="flex items-center -ml-1.5">
          <DocumentMenubar />
        </div>
      </div>
    </nav>
  );
};
