import { Editor } from "./editor";
import { Toolbar } from "./toolbar";
import { Navbar } from "./navbar";
import { Ruler } from "./ruler";

interface DocumentIdPageProps {
    params: Promise<{documentId: string}>;
}

const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
    const { documentId } = await params;
    return (
        <div className="min-h-screen bg-[#FAFBFD] flex flex-col">
            {/* Top navigation: logo + title + menubar */}
            <Navbar />

            {/* Toolbar: formatting controls */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#e0e0e0] px-4 py-1 print:hidden">
                <Toolbar />
            </div>

            {/* Margin ruler */}
            <Ruler />

            {/* Editor canvas */}
            <Editor />
        </div>
    );
};

export default DocumentIdPage;
