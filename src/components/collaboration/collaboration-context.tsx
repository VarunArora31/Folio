"use client";

import { createContext, useContext } from "react";
import type { CollaborationUser } from "@/hooks/use-collaboration";

// ── Context shape ─────────────────────────────────────────────────────────────

interface CollaborationContextValue {
  isConnected: boolean;
  isSynced: boolean;
  activeUsers: CollaborationUser[];
  error: string | null;
}

const CollaborationContext = createContext<CollaborationContextValue>({
  isConnected: false,
  isSynced: false,
  activeUsers: [],
  error: null,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function CollaborationProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CollaborationContextValue;
}) {
  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCollaborationContext() {
  return useContext(CollaborationContext);
}
