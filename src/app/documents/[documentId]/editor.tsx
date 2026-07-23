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
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditorStore } from "@/store/use-editor-store";
import * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

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
  provider: WebsocketProvider | null;
}

export const Editor = ({ documentId, initialContent, initialTitle, ydoc, provider }: EditorProps) => {
  const { setEditor, leftMargin, rightMargin, setIsSaved } = useEditorStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string | null>(null);

  // ── Auto-save function ────────────────────────────────────────────────────
  const save = useCallback(async (content: string) => {
    if (content === lastSaved.current) return; // nothing changed
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
      // Seed lastSaved so first load doesn't trigger a spurious save
      lastSaved.current = editor.getHTML();
    },
    onDestroy: () => setEditor(null),
    onUpdate: ({ editor }) => {
      setEditor(editor);
      // With Y.js collaboration, auto-save happens via WebSocket
      // But we still debounce for backup saves to REST API
      setIsSaved(true); // Consider synced once Y.js is connected
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        save(editor.getHTML());
      }, 5000); // Longer debounce since Y.js handles real-time sync
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
        class: "tiptap focus:outline-none print:border-0 bg-white flex flex-col min-h-[1054px] w-[816px] pt-10",
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 24px rgba(0,0,0,0.08);`,
      },
    },

    extensions: [
      // StarterKit with history disabled (Y.js provides its own undo/redo via Collaboration)
      StarterKit.configure({
        // @ts-expect-error — history exists at runtime in StarterKit 3.x but missing from types
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
      
      // Y.js Collaboration Extensions
      ...(ydoc && provider
        ? [
            Collaboration.configure({
              document: ydoc,
            }),
            CollaborationCursor.configure({
              provider: provider,
              user: {
                name: "Loading...", // Will be updated by awareness
                color: "#4F46E5",
              },
            }),
          ]
        : []),
    ],

    // Only set initial content if Y.js is not connected
    // Y.js will handle content sync once connected
    content: ydoc ? undefined : (initialContent || "<p></p>"),
    immediatelyRender: false,
  }, [ydoc, provider]); // Re-create editor when Y.js connection changes

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="size-full overflow-x-auto print-canvas-surround px-4 print:px-0 print:bg-white print:overflow-visible"
      style={{ background: "#e8e6e1" }}>
      <div className="relative min-w-max flex justify-center py-4 print:py-0 mx-auto print:w-full print:min-w-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
