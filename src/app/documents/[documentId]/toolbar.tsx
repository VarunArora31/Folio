"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Redo2Icon,
  Undo2Icon,
  PrinterIcon,
  SpellCheck2Icon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  HighlighterIcon,
  ChevronDownIcon,
  type LucideIcon,
  MessageSquarePlusIcon,
  ListTodoIcon,
  RemoveFormattingIcon,
  Trash2Icon,
  Link2Icon
} from "lucide-react";
import { ColorResult, SketchPicker}  from "react-color";
import { type Level } from "@tiptap/extension-heading";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/use-editor-store";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHighlighterPen } from "@/hooks/use-highlighter-pen";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageIcon, UploadIcon, SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRef} from "react";

// Link Button
const LinkButton = () => {
  const { editor } = useEditorStore();
  const [value, setValue] = useState("");

  const onChange = (href: string) => {
    // Ensure the URL has a protocol so it doesn't resolve as relative path
    const url =
      href.startsWith("http://") || href.startsWith("https://")
        ? href
        : `https://${href}`;

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
    setValue("");
  };

  const handleRemove = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setValue("");
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          setValue(editor?.getAttributes("link").href || "");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          onMouseDown={(e) => e.preventDefault()}
          className="h-7 min-w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
        >
          <Link2Icon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2.5 flex items-center gap-x-2 w-full">
        <input
          placeholder="https://example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(value);
            }
          }}
          className="h-8 flex-1 rounded-sm border border-neutral-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400 w-55"
        />
        {editor?.isActive("link") && (
          <button
            onClick={handleRemove}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-sm hover:bg-red-100 text-red-500 transition-colors"
            title="Remove link"
          >
            <Trash2Icon className="size-4" />
          </button>
        )}
        <button
          onClick={() => onChange(value)}
          disabled={!value}
          className="h-8 px-3 shrink-0 rounded-sm bg-neutral-800 text-white text-sm hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Apply
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Image Button
const ImageButton = () => {
  const { editor } = useEditorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (src: string) => {
    editor?.chain().focus().setImage({ src }).run();
  };

  const onUpload = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange(url);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      onChange(imageUrl);
      setImageUrl("");
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 min-w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
          >
            <ImageIcon className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onUpload}>
            <UploadIcon className="size-4 mr-2" />
            Upload from computer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <SearchIcon className="size-4 mr-2" />
            Paste image URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={onFileChange}
        className="hidden"
      />

      {/* URL Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Insert Image URL</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-y-4">
            <input
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImageUrlSubmit();
              }}
              className="h-8 w-full rounded-sm border border-neutral-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400"
            />
            <DialogFooter>
              <button
                onClick={handleImageUrlSubmit}
                disabled={!imageUrl}
                className="h-8 px-4 rounded-sm bg-neutral-800 text-white text-sm hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Insert
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Text Color Button
const TextColorButton = () => {
  const { editor } = useEditorStore();
  const value = editor?.getAttributes("textStyle").color || "#000000";

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setColor(color.hex).run();
  };

  const colors = [
    "#000000",
    "#434343",
    "#666666",
    "#999999",
    "#b7b7b7",
    "#cccccc",
    "#d9d9d9",
    "#ffffff",
    "#ff0000",
    "#ff4500",
    "#ff9900",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#4a90d9",
    "#9900ff",
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
    "#ea9999",
    "#f9cb9c",
    "#ffe599",
    "#b6d7a8",
    "#a2c4c9",
    "#9fc5e8",
    "#b4a7d6",
    "#c27ba0",
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          onMouseDown={(e) => e.preventDefault()}
          className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center gap-y-0.5 rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm transition-colors duration-150">
          <span
            className="text-xs font-bold leading-none"
            style={{ color: value }}
          >
            A
          </span>
          <div
            className="h-0.75 w-4 rounded-full transition-colors duration-200"
            style={{ backgroundColor: value }}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="p-3 shadow-lg rounded-xl border border-neutral-200 bg-white"
        style={{ width: "224px" }}  
        sideOffset={6}
      >
        {/* Current color preview */}
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-neutral-100">
          <div
            className="h-6 w-6 rounded-md border border-neutral-200 shadow-sm shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
            {value}
          </span>
        </div>

        {/* Color grid */}
        <div className="grid grid-cols-8 gap-1 mb-3">
          {colors.map((color, index) => (
            <button
              key={`${color}-${index}`}
              onClick={() => editor?.chain().focus().setColor(color).run()}
              className="group relative h-6 w-6 rounded-md border border-neutral-200 transition-all duration-150 hover:scale-110 hover:shadow-md focus:outline-none"
              style={{ backgroundColor: color }}
              title={color}
            >
              {value === color && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 drop-shadow"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke={
                        color === "#ffffff" || color === "#ffff00"
                          ? "#000"
                          : "#fff"
                      }
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Custom color — native input, no third-party picker */}
        <div className="border-t border-neutral-100 pt-2.5 flex items-center gap-2">
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
            Custom
          </p>
          <input
            type="color"
            value={value}
            onChange={(e) =>
              editor?.chain().focus().setColor(e.target.value).run()
            }
            className="h-7 w-full rounded-md border border-neutral-200 cursor-pointer bg-transparent"
          />
        </div>
        {/* Reset to default */}
        <button
          onClick={() => editor?.chain().focus().unsetColor().run()}
          className="mt-2.5 w-full text-xs text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors duration-150 rounded-md py-1 text-center"
        >
          Reset to default
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
// Heading 
const HeadingLevelButton = () => {
  const { editor } = useEditorStore();
  const Headings = [
    {
      label: "Normal text",
      value: 0,
      fontSize: "16px",
    },
    {
      label: "Heading 1",
      value: 1,
      fontSize: "32px",
    },
    {
      label: "Heading 2",
      value: 2,
      fontSize: "24px",
    },
    {
      label: "Heading 3",
      value: 3,
      fontSize: "20px",
    },
    {
      label: "Heading 4",
      value: 4,
      fontSize: "18px",
    },
    {
      label: "Heading 5",
      value: 5,
      fontSize: "16px",
    },
    {
      label: "Heading 6",
      value: 6,
      fontSize: "14px",
    },
  ];

  const getCurrentHeading = () => {
    for (let level = 1; level <= 6; level++) {
      if (editor?.isActive("heading", { level })) {
        return `Heading ${level}`;
      }
    }
    return "Normal text";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
        onMouseDown={(e) => e.preventDefault()} 
        className="h-7 min-w-7 shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
        >
          <span className="truncate">{getCurrentHeading()}</span>
          <ChevronDownIcon className="ml-1 size-3.5 shrink-0 text-neutral-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-0.5 min-w-40">
        {Headings.map(({ label, value, fontSize }) => (
          <DropdownMenuItem
            key={value}
            style={{ fontSize }}
            onClick={() => {
              if (value === 0) {
                editor?.chain().focus().setParagraph().run();
              } else {
                editor
                  ?.chain()
                  .focus()
                  .toggleHeading({ level: value as Level })
                  .run();
              }
            }}
            className={cn(
              "px-2 py-1.5 rounded-sm text-sm cursor-pointer",
              ((value === 0 && !editor?.isActive("heading")) ||
                editor?.isActive("heading", { level: value })) &&
                "bg-neutral-200/80",
            )}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
// Font Family 
const FontFamilyButton = () => {
  const { editor } = useEditorStore();
  const fonts = [
    { label: "Arial", value: "Arial" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Courier New", value: "Courier New" },
    { label: "Georgia", value: "Georgia" },
    { label: "Monospace", value: "Monospace" },
    { label: "Cursive", value: "Cursive" },
    { label: "Comic Sans MS", value: "Comic Sans MS, Comic Sans" },
    { label: "Exo 2", value: "Exo2" },
    { label: "Verdana", value: "Verdana"}
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
        onMouseDown={(e) => e.preventDefault()}
        className="h-7 w-32 shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm">
          <span className="truncate">
            {editor?.getAttributes("textStyle").fontFamily || "Times New Roman"}
          </span>
          <ChevronDownIcon className="ml-1 size-3.5 shrink-0 text-neutral-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-0.5 min-w-40">
        {fonts.map(({ label, value }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => editor?.chain().focus().setFontFamily(value).run()}
            className={cn(
              "px-2 py-1.5 rounded-sm text-sm cursor-pointer",
              editor?.getAttributes("textStyle").fontFamily === value &&
                "bg-neutral-200/80",
            )}
            style={{ fontFamily: value }}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Highlight presets 
const HIGHLIGHT_PRESETS = [
  { label: "Yellow", value: "#FFF176", textColor: "#7A6B00" },
  { label: "Green", value: "#B9F6CA", textColor: "#1B5E20" },
  { label: "Cyan", value: "#80DEEA", textColor: "#005F6B" },
  { label: "Pink", value: "#F48FB1", textColor: "#7B1235" },
  { label: "Orange", value: "#FFCC80", textColor: "#7A3E00" },
  { label: "Lavender", value: "#CE93D8", textColor: "#4A148C" },
];

// Toolbar button
interface ToolbarButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  icon: LucideIcon;
}

const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
}: ToolbarButtonProps) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={cn(
      "text-sm h-7 min-w-7 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 transition-colors",
      isActive && "bg-neutral-200/80",
    )}
  >
    <Icon className="size-4" />
  </button>
);

// Pen cursor
const HIGHLIGHTER_CURSOR = (color: string): string => {
  const dark = color + "CC";
  const nib = color + "99";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 28 36'><rect x='8' y='0' width='12' height='22' rx='2' fill='${color}' stroke='%23999' stroke-width='0.8'/><rect x='8' y='16' width='12' height='5' rx='1' fill='${dark}' stroke='%23999' stroke-width='0.8'/><rect x='8' y='0' width='12' height='6' rx='2' fill='%23ffffffaa' stroke='%23999' stroke-width='0.8'/><polygon points='9,21 19,21 17,28 11,28' fill='${nib}' stroke='%23888' stroke-width='0.7'/><polygon points='11,27 17,27 14,34' fill='%23555' stroke='%23444' stroke-width='0.6'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 14 34, crosshair`;
};

// Highlight button
const HighlightButton = () => {
  const { editor, highlightColor, setHighlightColor } = useEditorStore();
  const [open, setOpen] = useState(false);
  const [penMode, setPenMode] = useState(false);

  useHighlighterPen(editor, penMode, highlightColor);

  useEffect(() => {
    const dom = editor?.view.dom as HTMLElement | undefined;
    if (!dom) return;
    if (penMode) {
      dom.style.cursor = HIGHLIGHTER_CURSOR(highlightColor);
      dom.style.userSelect = "none";
      dom.style.webkitUserSelect = "none";
    } else {
      dom.style.cursor = "";
      dom.style.userSelect = "";
      dom.style.webkitUserSelect = "";
    }
  }, [penMode, highlightColor, editor]);

  useEffect(() => {
    if (!penMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPenMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [penMode]);

  const selectionColor: string =
    editor?.getAttributes("highlight").color ?? "none";
  const isHighlightActive = editor?.isActive("highlight") ?? false;
  const displayColor = isHighlightActive ? selectionColor : highlightColor;

  const applyColor = useCallback(
    (color: string) => {
      if (!editor) return;
      if (color === "none") {
        editor.chain().focus().unsetHighlight().run();
      } else {
        setHighlightColor(color);
        const { from, to } = editor.state.selection;
        if (from !== to) {
          editor.chain().focus().setHighlight({ color }).run();
        }
      }
      setOpen(false);
    },
    [editor, setHighlightColor],
  );

  return (
    <div className="flex items-center">
      <button
        onClick={() => {
          setPenMode((p) => !p);
          editor?.commands.focus();
        }}
        title={
          penMode
            ? "Pen active — drag to highlight. Press Esc to exit."
            : "Highlighter pen"
        }
        className={cn(
          "relative h-7 w-7 flex flex-col items-center justify-center rounded-sm transition-all gap-0.5",
          penMode
            ? "bg-yellow-100 ring-2 ring-yellow-400 ring-offset-1"
            : "hover:bg-neutral-200/80",
        )}
      >
        <HighlighterIcon className="size-4" />
        <div
          className="h-0.75 w-4 rounded-full transition-colors"
          style={{
            backgroundColor: displayColor === "none" ? "#d1d5db" : displayColor,
          }}
        />
        {penMode && (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-yellow-400 ring-1 ring-white" />
        )}
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 w-4 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 transition-colors"
            title="Choose highlight color"
          >
            <ChevronDownIcon className="size-3 text-neutral-500" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-56 p-4 rounded-2xl border border-neutral-100 shadow-xl bg-white"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] text-neutral-400 uppercase mb-3">
            Highlight color
          </p>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {HIGHLIGHT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                title={preset.label}
                onClick={() => applyColor(preset.value)}
                className={cn(
                  "h-8 w-full rounded-xl text-[11px] font-medium tracking-wide transition-all hover:scale-[1.04]",
                  highlightColor === preset.value
                    ? "ring-2 ring-offset-1 ring-sky-400 scale-[1.04]"
                    : "hover:ring-1 hover:ring-neutral-300",
                )}
                style={{
                  backgroundColor: preset.value,
                  color: preset.textColor,
                  border: "none",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <Separator className="mb-3" />

          <div className="flex items-center gap-2.5 mb-3">
            <label
              className="relative size-6 rounded-md border border-neutral-200 cursor-pointer overflow-hidden shrink-0 hover:scale-105 transition-transform"
              style={{ backgroundColor: highlightColor }}
              title="Custom color"
            >
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            <span className="font-mono text-[12px] tracking-[0.04em] text-neutral-400">
              {highlightColor.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => applyColor("none")}
            className="w-full text-left flex items-center gap-2 py-0.5 group"
          >
            <span className="inline-flex size-4.5 rounded-[5px] border border-neutral-200 items-center justify-center shrink-0 transition-colors group-hover:border-red-300 group-hover:bg-red-50">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="text-neutral-400 group-hover:text-red-400"
                />
              </svg>
            </span>
            <span className="text-[13px] text-neutral-400 group-hover:text-red-500 transition-colors">
              Remove highlight
            </span>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Toolbar
export const Toolbar = () => {
  const { editor } = useEditorStore();

  const historySection = [
    {
      label: "Undo",
      icon: Undo2Icon,
      onClick: () => editor?.chain().focus().undo().run(),
      isActive: false,
    },
    {
      label: "Redo",
      icon: Redo2Icon,
      onClick: () => editor?.chain().focus().redo().run(),
      isActive: false,
    },
    {
      label: "Print",
      icon: PrinterIcon,
      onClick: () => window.print(),
      isActive: false,
    },
    {
      label: "Spell Check",
      icon: SpellCheck2Icon,
      onClick: () => {
        const cur = editor?.view.dom.getAttribute("spellcheck");
        editor?.view.dom.setAttribute(
          "spellcheck",
          cur === "true" ? "false" : "true",
        );
      },
      isActive: false,
    },
  ];

  const formatSection = [
    {
      label: "Bold",
      icon: BoldIcon,
      onClick: () => editor?.chain().focus().toggleBold().run(),
      isActive: editor?.isActive("bold") ?? false,
    },
    {
      label: "Italic",
      icon: ItalicIcon,
      onClick: () => editor?.chain().focus().toggleItalic().run(),
      isActive: editor?.isActive("italic") ?? false,
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: editor?.isActive("underline") ?? false,
    },
  ];

  const extraSection = [
    {
      label: "Comment",
      icon: MessageSquarePlusIcon,
      onClick: () => console.log("TODO: Comment"),
      isActive: false,
    },
    {
      label: "List Todo",
      icon: ListTodoIcon,
      onClick: () => editor?.chain().focus().toggleTaskList().run(),
      isActive: editor?.isActive("taskList") ?? false,
    },
    {
      label: "Remove Formatting",
      icon: RemoveFormattingIcon,
      onClick: () => editor?.chain().focus().unsetAllMarks().run(),
    }
  ];

  return (
    <div className="bg-[#f1f4f9] px-2.5 py-0.5 rounded-[24px] min-h-10 flex items-center gap-x-0.5 overflow-x-auto">
      {/* History */}
      {historySection.map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}

      <Separator orientation="vertical" className="h-6 bg-neutral-300 w-px mx-1" />

      {/* Font family */}
      <FontFamilyButton />

      <Separator orientation="vertical" className="h-6 bg-neutral-300 w-px mx-1" />

      {/* TODO: Font size */}
      {<HeadingLevelButton/>}

      {/* Format */}
      {formatSection.map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      {/* Highlighter */}
      <HighlightButton />
      {/* Text Color */}
      <TextColorButton/>

      <Separator orientation="vertical" className="h-6 bg-neutral-300 w-px mx-1" />

      {/* TODO: Text alignment */}
      {/* TODO: Link */}
      <LinkButton/>
      {/* TODO: Image */}
      <ImageButton/>
      {/* TODO: Line height */}
      {/* TODO: List */}

      {/* Extra */}
      {extraSection.map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
    </div>
  );
};
