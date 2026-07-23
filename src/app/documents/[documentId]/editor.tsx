"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import FontSize from "@tiptap/extension-font-size";
import Collaboration from "@tiptap/extension-collaboration";
import { useEditorStore } from "@/store/use-editor-store";
import type { CustomProvider } from "@/hooks/use-collaboration";
import * as Y from "yjs";

// ── Custom Image with alignment support ───────────────────────────────────────

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: "display: block; margin-left: 0; margin-right: auto;",
        parseHTML: (el) => el.getAttribute("style") || "",
        renderHTML: (attrs) => ({ style: attrs.style || "" }),
      },
    };
  },
});

// ── Custom LineHeight extension ───────────────────────────────────────────────

const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return { types: ["paragraph", "heading"], defaultLineHeight: "normal" };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: this.options.defaultLineHeight,
          parseHTML: (el) => el.style.lineHeight || this.options.defaultLineHeight,
          renderHTML: (attrs) => {
            if (!attrs.lineHeight || attrs.lineHeight === this.options.defaultLineHeight) return {};
            return { style: `line-height: ${attrs.lineHeight}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) =>
        this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight })),
      unsetLineHeight: () => ({ commands }) =>
        this.options.types.every((type: string) => commands.resetAttributes(type, "lineHeight")),
    };
  },
});

// ── Editor component ──────────────────────────────────────────────────────────

interface EditorProps {
  documentId: string;
  initialContent: string | null;
  initialTitle: string;
  ydoc: Y.Doc | null;
  provider: CustomProvider | null;
  readOnly?: boolean;
}

export const Editor = ({ documentId, initialContent, ydoc, provider, readOnly = false }: EditorProps) => {
  const { setEditor, leftMargin, rightMargin, setIsSaved, setCurrentPage, setTotalPages } = useEditorStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A4 page height + gap = 1146px per stripe
  const PAGE_H = 1122;
  const GAP_H  = 24;
  const STRIPE = PAGE_H + GAP_H;

  // Track scroll position to derive current page number
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const page = Math.floor(scrollTop / STRIPE) + 1;
    setCurrentPage(Math.max(1, page));
  }, [STRIPE, setCurrentPage]);

  // Recalculate total pages when content changes
  const updateTotalPages = useCallback(() => {
    if (!scrollRef.current) return;
    const editorEl = scrollRef.current.querySelector(".tiptap");
    if (!editorEl) return;
    const height = editorEl.scrollHeight;
    setTotalPages(Math.max(1, Math.ceil(height / PAGE_H)));
  }, [PAGE_H, setTotalPages]);

  // ── Auto-save to REST API ─────────────────────────────────────────────────
  // This is the primary save path — always works regardless of WebSocket state.
  // Y.js collaboration syncs in real-time between users but this ensures
  // content is always persisted to the database.
  const save = useCallback(async (content: string) => {
    if (content === lastSaved.current) return;
    setIsSaved(false);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      lastSaved.current = content;
      setIsSaved(true);
    } catch {
      // will retry on next keystroke
    }
  }, [documentId, setIsSaved]);

  const editor = useEditor({
    onCreate: ({ editor }) => {
      setEditor(editor);
      lastSaved.current = editor.getHTML();
      setTimeout(updateTotalPages, 150);
    },
    onDestroy: () => setEditor(null),
    onUpdate: ({ editor }) => {
      setEditor(editor);
      setIsSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        save(editor.getHTML());
      }, 1500);
      updateTotalPages();
    },
    onSelectionUpdate: ({ editor }) => setEditor(editor),
    onTransaction:     ({ editor }) => setEditor(editor),
    onFocus:           ({ editor }) => setEditor(editor),
    onBlur:            ({ editor }) => {
      setEditor(editor);
      // Save immediately on blur
      if (saveTimer.current) clearTimeout(saveTimer.current);
      save(editor.getHTML());
    },
    onContentError: ({ editor }) => setEditor(editor),

    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none print:border-0 flex flex-col min-h-[1122px] w-[816px]",
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
      },
    },
    editable: !readOnly,

    extensions: [
      // Disable StarterKit history — Y.js handles undo/redo when connected
      StarterKit.configure({
        // @ts-expect-error — history exists at runtime in StarterKit 3.x
        history: false,
      }),
      Highlight.configure({ multicolor: true }),
      TableKit.configure({ table: { resizable: true } }),
      CustomImage.configure({ resize: { enabled: true, alwaysPreserveAspectRatio: true }, allowBase64: true }),
      TaskItem.configure({ nested: true }),
      TaskList,
      FontFamily,
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),

      // Y.js Collaboration — only added when WebSocket is connected
      ...(ydoc
        ? [Collaboration.configure({ document: ydoc })]
        : []),
    ],

    // When Y.js is connected, content comes from the synced Y.js document.
    // When offline/disconnected, load from DB content directly.
    content: ydoc ? undefined : (initialContent || "<p></p>"),
    immediatelyRender: false,
  }, [ydoc]); // Re-create editor only when ydoc changes (not provider)

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="size-full overflow-x-auto overflow-y-auto print:bg-white print:overflow-visible"
      style={{ background: "#e8e6e1" }}
    >
      {/* Center the 816px page canvas with vertical breathing room */}
      <div className="flex justify-center py-8 print:py-0 print:block">
        <div className="page-canvas-wrap print:shadow-none print:filter-none">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
