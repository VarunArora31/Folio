"use client";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/use-editor-store";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ImageAlignMenu = () => {
  const { editor } = useEditorStore();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      if (!editor.isActive("image")) {
        setVisible(false);
        return;
      }

      const { from } = editor.state.selection;
      const node = editor.view.nodeDOM(from) as HTMLElement | null;
      const img = node?.tagName === "IMG" ? node : node?.querySelector("img");

      if (!img) {
        setVisible(false);
        return;
      }

      const imgRect = img.getBoundingClientRect();
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

    // Hide only when clicking outside both the editor and this menu
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        editor.view.dom.contains(target)
      ) {
        return;
      }
      setVisible(false);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [editor]);

  if (!editor || !visible) return null;
  const currentStyle = editor.getAttributes("image").style || "";
  const isCenter = currentStyle.includes("margin: 0 auto") || currentStyle.includes("margin-left: auto");
  const isRight = currentStyle.includes("margin-left: auto") && currentStyle.includes("margin-right: 0");
  const isLeft = !isCenter && !isRight;

  const align = (alignment: "left" | "center" | "right") => {
    const styleMap = {
      left: "display: block; margin-left: 0; margin-right: auto;",
      center: "display: block; margin-left: auto; margin-right: auto;",
      right: "display: block; margin-left: auto; margin-right: 0;",
    };
    editor
      .chain()
      .focus()
      .updateAttributes("image", { style: styleMap[alignment] })
      .run();
  };

  return (
    <div
      ref={menuRef}
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
        onClick={() => align("left")}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-sm hover:bg-neutral-100",
          isLeft && "bg-neutral-200",
        )}
        title="Align left"
      >
        <AlignLeft className="size-4" />
      </button>
      <button
        onClick={() => align("center")}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-sm hover:bg-neutral-100",
          isCenter && "bg-neutral-200",
        )}
        title="Align center"
      >
        <AlignCenter className="size-4" />
      </button>
      <button
        onClick={() => align("right")}
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