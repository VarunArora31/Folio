import { create } from "zustand";
import { type Editor } from "@tiptap/react";

interface EditorStore {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  highlightColor: "#FFF176",
  setHighlightColor: (color) => set({ highlightColor: color }),
}));
