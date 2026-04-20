"use client";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/use-editor-store";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ImageAlignMenu = () => {
  const { editor } = useEditorStore();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      if (!editor.isActive("image")) {
        setVisible(false);
        return;
      }

      const { from } = editor.state.selection;
      const node = editor.view.nodeDOM(from) as HTMLElement | null;
      // nodeDOM can return the wrapper div, find the actual img
      const img = node?.tagName === "IMG" ? node : node?.querySelector("img");
      if (!img) {
        setVisible(false);
        return;
      }

      const imgRect = img.getBoundingClientRect();
      // Use the editor's scroll container as the offset parent
      const container =
        editor.view.dom.closest(".tiptap-scroll-container") ??
        editor.view.dom.parentElement!;
      const containerRect = container.getBoundingClientRect();

      setPos({
        top: imgRect.top - containerRect.top + container.scrollTop - 44,
        left: imgRect.left - containerRect.left + imgRect.width / 2,
      });
      setVisible(true);
    };

    editor.on("selectionUpdate", update);
    editor.on("blur", () => setVisible(false));
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  if (!editor || !visible) return null;

  const currentStyle = editor.getAttributes("image").style ?? "";
  const isLeft = !currentStyle.includes("margin-left: auto");
  const isCenter =
    currentStyle.includes("margin-left: auto") &&
    currentStyle.includes("margin-right: auto");
  const isRight =
    currentStyle.includes("margin-left: auto") &&
    !currentStyle.includes("margin-right: auto");

  const align = (style: string) =>
    editor.chain().focus().updateAttributes("image", { style }).run();

  return (
    <div
      style={{
        position: "absolute",
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-x-0.5 bg-white border border-neutral-200 rounded-md shadow-md p-0.5"
    >
      <button
        onClick={() =>
          align("display: block; margin-left: 0; margin-right: auto;")
        }
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-sm hover:bg-neutral-100",
          isLeft && "bg-neutral-200",
        )}
        title="Align left"
      >
        <AlignLeft className="size-4" />
      </button>
      <button
        onClick={() =>
          align("display: block; margin-left: auto; margin-right: auto;")
        }
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-sm hover:bg-neutral-100",
          isCenter && "bg-neutral-200",
        )}
        title="Align center"
      >
        <AlignCenter className="size-4" />
      </button>
      <button
        onClick={() =>
          align("display: block; margin-left: auto; margin-right: 0;")
        }
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-sm hover:bg-neutral-100",
          isRight && "bg-neutral-200",
        )}
        title="Align right"
      >
        <AlignRight className="size-4" />
      </button>
    </div>
  );
};
