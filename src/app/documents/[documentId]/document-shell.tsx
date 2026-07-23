"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();

  // Derive display name from real Clerk user — no hardcoding
  const currentUserName = user
    ? user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Unknown"
    : "Unknown";

  const { ydoc, provider, isConnected, isSynced, activeUsers, error } =
    useCollaboration({ documentId, enabled: true });

  // Once provider is connected and we have the real user name, update awareness
  useEffect(() => {
    if (provider && isConnected && user) {
      provider.updateAwareness({
        name: currentUserName,
        color: generateUserColor(user.id),
        userId: user.id,
      });
    }
  }, [provider, isConnected, user, currentUserName]);

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

// Same deterministic color as server — keeps colors consistent
function generateUserColor(userId: string): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

