// Server components are static, so they cannot use React hooks
// So, convert them into client component, as it uses the useEditor hook from @tiptap/react, 
// which is a React hook that manages the state of the editor.
"use client"; // Client Component
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";

import { useEditorStore } from "@/store/use-editor-store";
import Hightlight from "@tiptap/extension-highlight"

import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";

export const Editor = () => {
    const { setEditor } = useEditorStore();
    // The useEditor hook initializes the editor and provides various lifecycle callbacks (e.g., onCreate, onUpdate, onFocus, etc.) 
    // that allow you to manage the editor's state and behavior.
    const editor = useEditor({
      onCreate: ({ editor }) => {
        setEditor(editor);
      },
      onDestroy: () => {
        setEditor(null);
      },
      onUpdate: ({ editor }) => {
        setEditor(editor);
      },
      onSelectionUpdate: ({ editor }) => {
        setEditor(editor);
      },
      onTransaction: ({ editor }) => {
        setEditor(editor);
      },
      onFocus: ({ editor }) => {
        setEditor(editor);
      },
      onBlur: ({ editor }) => {
        setEditor(editor);
      },
      onContentError: ({ editor }) => {
        setEditor(editor);
      },
      editorProps: {
        attributes: {
          style: "padding-left: 55px; padding-right: 55px",
          class:
            "tiptap focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-[816px] pt-10 pr-14",
        },
      },
      extensions: [
        StarterKit,
        Hightlight.configure({
          multicolor: true,
        }),
        TableKit.configure({
          table: { resizable: true },
        }),
        Image.configure({
          inline: true,
          resize: {
            enabled: true,
            alwaysPreserveAspectRatio: true,
          },
          allowBase64: true
        }),
        TaskItem.configure({
          nested: true, // Allow nesting of task items within other task items, enabling the creation of sub-tasks.
        }),
        TaskList,
        FontFamily,
        TextStyle,
        Color,
        // Link.configure({
        //   openOnClick: false, // keep false
        //   autolink: true,
        //   defaultProtocol: "https",
        // }),
      ],
      content: `
            <table>
            <tbody>
                <tr>
                <th>Name</th>
                <th colspan="3">Description</th>
                </tr>
                <tr>
                <td>Cyndi Lauper</td>
                <td>Singer</td>
                <td>Songwriter</td>
                <td>Actress</td>
                </tr>
            </tbody>
            </table> `,
      immediatelyRender: false, // Prevents the editor from rendering immediately, allowing for better performance and control over when the editor is rendered.
    });

    if (!editor) return null;

    return (
      <div className="size-full overflow-x-auto bg-[#FAFBFD] px-4 print:px-0 print:bg-white print:overflow-visible">
        <div className="min-w-max flex justify-center w-204 py-4 print:py-0 mx-auto print:w-full print:min-w-0">
          <EditorContent
            editor={editor}
          />
        </div>
      </div>
    );
};
