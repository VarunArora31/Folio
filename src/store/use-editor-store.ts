import { create } from "zustand";
import { type Editor } from "@tiptap/react";

interface EditorStore {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  // Ruler margins
  leftMargin: number;
  rightMargin: number;
  setLeftMargin: (margin: number) => void;
  setRightMargin: (margin: number) => void;
  // Save state — shown in navbar cloud icon
  isSaved: boolean;
  setIsSaved: (saved: boolean) => void;
  // Page state — shown in navbar
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  highlightColor: "#FFF176",
  setHighlightColor: (color) => set({ highlightColor: color }),
  leftMargin: 56,
  rightMargin: 56,
  setLeftMargin: (margin) => set({ leftMargin: margin }),
  setRightMargin: (margin) => set({ rightMargin: margin }),
  isSaved: true,
  setIsSaved: (saved) => set({ isSaved: saved }),
  currentPage: 1,
  totalPages: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
}));
