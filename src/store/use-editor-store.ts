import { create } from "zustand";
import { type Editor } from "@tiptap/react";

interface EditorStore {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  // Ruler margins (in inches, page width = 8.5in, content = 6.5in)
  leftMargin: number;
  rightMargin: number;
  setLeftMargin: (margin: number) => void;
  setRightMargin: (margin: number) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  highlightColor: "#FFF176",
  setHighlightColor: (color) => set({ highlightColor: color }),
  leftMargin: 56,   // px equivalent of ~0.7in at 96dpi
  rightMargin: 56,
  setLeftMargin: (margin) => set({ leftMargin: margin }),
  setRightMargin: (margin) => set({ rightMargin: margin }),
}));
