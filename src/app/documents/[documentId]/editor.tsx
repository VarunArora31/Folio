    // Server components are static, so they cannot use React hooks
    // So, convert them into client component, as it uses the useEditor hook from @tiptap/react, which is a React hook that manages the state of the editor. 
    
    "use client"; // Client Component
    import {useEditor, EditorContent} from '@tiptap/react';
    import StarterKit from '@tiptap/starter-kit';
    import TaskItem from '@tiptap/extension-task-item';
    import TaskList from '@tiptap/extension-task-list';

    export const Editor = () => {   
        const editor = useEditor({
        editorProps: {
            attributes: {
            style: "padding-left: 55px; padding-right: 55px",
            class: "tiptap focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-[816px] pt-10 pr-14"
            },
        },
        extensions: [
            StarterKit,
            TaskItem.configure({
            nested: true, // Allow nesting of task items within other task items, enabling the creation of sub-tasks.
            }),
            TaskList,
        ],
        content: "<p>Hello World! 🌎️</p>",
        immediatelyRender: false, // Prevents the editor from rendering immediately, allowing for better performance and control over when the editor is rendered.
        });

        if (!editor) return null;
    return (
        <div className="size-full overflow-x-auto bg-[#FAFBFD] px-4 print:px-0 print:bg-white print:overflow-visible">
        <div className="min-w-max flex justify-center w-204 py-4 print:py-0 mx-auto print:w-full print:min-w-0">
            <EditorContent editor={editor} />
        </div>
        </div>
    );
    };