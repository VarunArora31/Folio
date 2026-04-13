import { useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";

export function useHighlighterPen(
  editor: Editor | null,
  isActive: boolean,
  color: string,
) {
  const isPainting = useRef(false);
  const anchorPos = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    const docPos = (e: MouseEvent): number | null => {
      const result = editor.view.posAtCoords({
        left: e.clientX,
        top: e.clientY,
      });
      return result?.pos ?? null;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isActive || e.button !== 0) return;
      e.preventDefault(); // prevent browser native text selection
      const pos = docPos(e);
      if (pos === null) return;
      isPainting.current = true;
      anchorPos.current = pos;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isActive || !isPainting.current || anchorPos.current === null)
        return;
      const pos = docPos(e);
      if (pos === null) return;

      const from = Math.min(anchorPos.current, pos);
      const to = Math.max(anchorPos.current, pos);
      if (from >= to) return;

      editor
        .chain()
        .setTextSelection({ from, to })
        .setHighlight({ color })
        .setTextSelection(to) // collapse so highlight applies cleanly
        .run();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isActive || !isPainting.current) return;
      isPainting.current = false;

      // Final stroke — highlight the last bit and collapse cursor
      const pos = docPos(e);
      if (pos !== null && anchorPos.current !== null) {
        const from = Math.min(anchorPos.current, pos);
        const to = Math.max(anchorPos.current, pos);
        if (from < to) {
          editor
            .chain()
            .setTextSelection({ from, to })
            .setHighlight({ color })
            .setTextSelection(to)
            .run();
        }
      }
      anchorPos.current = null;
    };

    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [editor, isActive, color]);
}
