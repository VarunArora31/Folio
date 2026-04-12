"use client"; // Client Component
import { Icon, 
    LucideIcon, 
    Redo2Icon, 
    Undo2Icon, 
    PrinterIcon, 
    SpellCheck2Icon, 
    BoldIcon, 
    ItalicIcon, 
    UnderlineIcon,
    HighlighterIcon,
    Highlighter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/use-editor-store";
import { Separator } from "@/components/ui/separator";

interface ToolbarButtonProps {
    onClick?: () => void;
    isActive?: boolean;
    icon: LucideIcon;
}
const ToolbarButton = (props: ToolbarButtonProps) => {
    const { onClick, isActive, icon: Icon } = props;    
    return (
        <button
            onClick={onClick}
            // using cn utility function to conditionally apply classes based on the isActive prop. 
            // If isActive is true, the button will have a background color of bg-neutral-200/80, otherwise it will not have that background color.
            className={cn(
                "text-sm h-7 min-w-7 flex items-center justify-center rounded-sm hover:bg-neutral-200/80",
                isActive && "bg-neutral-200/80"
            )}
        >
            <Icon className="size-4"/>
        </button>
    );
}

export const Toolbar = () => {
    const { editor } = useEditorStore();
    const sections: {
      label: string;
      icon: LucideIcon;
      onClick: () => void;
      isActive: boolean;
    }[][] = [
      [
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
          // Browser's built-in spell check is typically enabled by setting the "spellcheck" attribute on the contenteditable element (in this case, the editor's DOM element).
          onClick: () =>
            editor?.view.dom.getAttribute("spellcheck") === "true"
              ? editor?.view.dom.setAttribute("spellcheck", "false")
              : editor?.view.dom.setAttribute("spellcheck", "true"),
          isActive: false,
        },
      ],
      [
        {
          label: "Bold",
          icon: BoldIcon,
          onClick: () => editor?.chain().focus().toggleBold().run(),
          isActive: editor?.isActive("bold") || false,
        },
        {
          label: "Italic",
          icon: ItalicIcon,
          onClick: () => editor?.chain().focus().toggleItalic().run(),
          isActive: editor?.isActive("italic") || false,
        },
        {
          label: "Underline",
          icon: UnderlineIcon,
          onClick: () => editor?.chain().focus().toggleUnderline().run(),
          isActive: editor?.isActive("underline") || false,
        },
        {
          label: "Highlighter",
          icon: Highlighter,
          onClick: () =>
            editor?.chain().focus().toggleHighlight({ color: "#ffff00" }).run(),
          isActive: editor?.isActive("highlight") || false,
        },
      ],
    ];
    return (
      <div className="bg-[#f1f4f9] px-2.5 py-0.5 rounded-[24px] min-h-10 flex items-center gap-x-0.5 overflow-x-auto">
        {sections.map((section) => (
          <div key={section[0].label} className="flex items-center gap-x-0.5">
            {section.map((item) => (
              <ToolbarButton key={item.label} {...item} />
            ))}
            <Separator orientation="vertical" className="h-5 bg-neutral-300" />
            {/*TODO: FONT SIZE*/}
            <Separator orientation="vertical" className="h-5 bg-neutral-300" />
            {/*TODO: FONT FAMILY*/}
            <Separator orientation="vertical" className="h-5 bg-neutral-300" />
            {/*TODO: HEADING*/}
            <Separator orientation="vertical" className="h-5 bg-neutral-300" />
            {/*TODO: TEXTALIGNMENT*/}
          </div>
        ))}
      </div>
    );
};