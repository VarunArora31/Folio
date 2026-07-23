"use client";

import { useEffect } from "react";
import { useCollaboration } from "@/hooks/use-collaboration";
import { CollaborationProvider } from "@/components/collaboration/collaboration-context";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import { Ruler } from "./ruler";
import { Editor } from "./editor";

type UserRole = "owner" | "editor" | "viewer" | "commenter";

interface DocumentShellProps {
  documentId: string;
  initialTitle: string;
  initialContent: string | null;
  userRole: UserRole;
}

export function DocumentShell({
  documentId,
  initialTitle,
  initialContent,
  userRole,
}: DocumentShellProps) {
  // ydoc is always initialized immediately via useState(() => new Y.Doc())
  // provider is null until WebSocket connects — editor handles this gracefully
  const { ydoc, provider, isConnected, isSynced, activeUsers, error } =
    useCollaboration({ documentId, enabled: true });

  // Keep browser tab title in sync with document title
  useEffect(() => {
    document.title = `${initialTitle || "Untitled Document"} — Folio`;
  }, [initialTitle]);

  const canEdit = userRole === "owner" || userRole === "editor";
  const isOwner = userRole === "owner";

  return (
    <CollaborationProvider value={{ isConnected, isSynced, activeUsers, error }}>
      <div className="min-h-screen flex flex-col" style={{ background: "#e8e6e1" }}>

        <Navbar
          documentId={documentId}
          initialTitle={initialTitle}
          isOwner={isOwner}
        />

        {/* View-only banner for non-editors */}
        {!canEdit && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center print:hidden">
            You have view-only access to this document
          </div>
        )}

        <div
          id="toolbar-container"
          className="sticky top-0 z-10 border-b px-2 sm:px-4 py-0.5 sm:py-1 print:hidden"
          style={{ background: "#2c2c2e", borderColor: "#3a3a3c" }}
        >
          <Toolbar readOnly={!canEdit} />
        </div>

        <Ruler />

        {/* Editor is always rendered — ydoc is always available */}
        <Editor
          documentId={documentId}
          initialContent={initialContent}
          initialTitle={initialTitle}
          ydoc={ydoc}
          provider={provider}
          readOnly={!canEdit}
        />

      </div>
    </CollaborationProvider>
  );
}
