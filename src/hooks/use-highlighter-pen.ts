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
    const resolveInlinePos = (pos: number): number | null => {
      const doc = editor.state.doc;
      if (pos < 0 || pos > doc.content.size) return null;
      try {
        const $pos = doc.resolve(pos);    
        for (let d = $pos.depth; d >= 0; d--) {
          const node = $pos.node(d);
          if (node.inlineContent) {
            const start = $pos.start(d);
            const end = $pos.end(d);
            return Math.min(Math.max(pos, start), end);
          }
        }
        return null;
      } catch {
        return null;
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!isActive || e.button !== 0) return;
      e.preventDefault();
      const pos = docPos(e);
      if (pos === null) return;
      const resolved = resolveInlinePos(pos);
      if (resolved === null) return;
      isPainting.current = true;
      anchorPos.current = resolved;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isActive || !isPainting.current || anchorPos.current === null)
        return;
      const pos = docPos(e);
      if (pos === null) return;
      const resolved = resolveInlinePos(pos);
      if (resolved === null) return;
      const from = Math.min(anchorPos.current, resolved);
      const to = Math.max(anchorPos.current, resolved);
      if (from >= to) return;
        
      const $from = editor.state.doc.resolve(from);
      const $to = editor.state.doc.resolve(to);
      if (!$from.parent.inlineContent || !$to.parent.inlineContent) return;

      editor
        .chain()
        .setTextSelection({ from, to })
        .setHighlight({ color })
        .setTextSelection(to)
        .run();
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!isActive || !isPainting.current) return;
      isPainting.current = false;

      const pos = docPos(e);
      if (pos !== null && anchorPos.current !== null) {
        const resolved = resolveInlinePos(pos);
        if (resolved !== null) {
          const from = Math.min(anchorPos.current, resolved);
          const to = Math.max(anchorPos.current, resolved);
          if (from < to) {
            const $from = editor.state.doc.resolve(from);
            const $to = editor.state.doc.resolve(to);
              
            if ($from.parent.inlineContent && $to.parent.inlineContent) {
              editor
                .chain()
                .setTextSelection({ from, to })
                .setHighlight({ color })
                .setTextSelection(to)
                .run();
            }
          }
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
