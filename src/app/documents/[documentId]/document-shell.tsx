"use client";

import { useCollaboration } from "@/hooks/use-collaboration";
import { CollaborationProvider } from "@/components/collaboration/collaboration-context";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import { Ruler } from "./ruler";
import { Editor } from "./editor";

interface DocumentShellProps {
  documentId: string;
  initialTitle: string;
  initialContent: string | null;
}

/**
 * DocumentShell owns the Y.js collaboration connection and provides it
 * via context to all child components (Navbar, Editor) without prop drilling.
 */
export function DocumentShell({
  documentId,
  initialTitle,
  initialContent,
}: DocumentShellProps) {
  const { ydoc, provider, isConnected, isSynced, activeUsers, error } =
    useCollaboration({ documentId, enabled: true });

  return (
    <CollaborationProvider
      value={{ isConnected, isSynced, activeUsers, error }}
    >
      <div className="min-h-screen flex flex-col" style={{ background: "#e8e6e1" }}>
        {/* Top navigation — reads collaboration state from context */}
        <Navbar documentId={documentId} initialTitle={initialTitle} />

        {/* Toolbar */}
        <div
          id="toolbar-container"
          className="sticky top-0 z-10 border-b px-2 sm:px-4 py-0.5 sm:py-1 print:hidden"
          style={{ background: "#2c2c2e", borderColor: "#3a3a3c" }}
        >
          <Toolbar />
        </div>

        {/* Margin ruler */}
        <Ruler />

        {/* Editor — receives pre-initialized Y.js ydoc and provider */}
        <Editor
          documentId={documentId}
          initialContent={initialContent}
          initialTitle={initialTitle}
          ydoc={ydoc}
          provider={provider}
        />
      </div>
    </CollaborationProvider>
  );
}
