import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export interface CollaborationUser {
  userId: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface UseCollaborationOptions {
  documentId: string;
  enabled?: boolean;
}

export interface UseCollaborationReturn {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  isConnected: boolean;
  isSynced: boolean;
  activeUsers: CollaborationUser[];
  error: string | null;
}

export function useCollaboration({
  documentId,
  enabled = true,
}: UseCollaborationOptions): UseCollaborationReturn {
  const { getToken } = useAuth();
  
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  const initialize = useCallback(async () => {
    if (!enabled || !documentId) return;

    try {
      // Get Clerk session token for authentication
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Create Y.js document
      const doc = new Y.Doc();
      setYdoc(doc);

      // WebSocket server URL (from environment variable)
      const wsUrl = process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || "ws://localhost:1234";

      // Connect to WebSocket provider with authentication
      const wsProvider = new WebsocketProvider(
        wsUrl,
        documentId,
        doc,
        {
          params: {
            token,
            documentId,
          },
        }
      );

      setProvider(wsProvider);

      // Connection status handlers
      wsProvider.on("status", ({ status }: { status: string }) => {
        console.log("[Collaboration] Status:", status);
        setIsConnected(status === "connected");
        
        if (status === "disconnected") {
          setError("Disconnected from collaboration server");
        } else {
          setError(null);
        }
      });

      wsProvider.on("sync", (isSynced: boolean) => {
        console.log("[Collaboration] Synced:", isSynced);
        setIsSynced(isSynced);
      });

      // Awareness (user presence) handlers
      wsProvider.awareness.on("change", () => {
        const states = wsProvider.awareness.getStates();
        const users: CollaborationUser[] = [];

        states.forEach((state, clientId) => {
          if (state.user && clientId !== wsProvider.awareness.clientID) {
            users.push({
              userId: state.user.userId,
              name: state.user.name,
              color: state.user.color,
              cursor: state.cursor,
            });
          }
        });

        setActiveUsers(users);
      });

      // Cleanup function
      cleanupRef.current = () => {
        console.log("[Collaboration] Cleaning up connection");
        wsProvider.disconnect();
        wsProvider.destroy();
        doc.destroy();
        setYdoc(null);
        setProvider(null);
        setIsConnected(false);
        setIsSynced(false);
        setActiveUsers([]);
      };

      console.log("[Collaboration] Initialized for document:", documentId);
    } catch (err) {
      console.error("[Collaboration] Initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize collaboration");
    }
  }, [documentId, enabled, getToken]);

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [initialize]);

  return {
    ydoc,
    provider,
    isConnected,
    isSynced,
    activeUsers,
    error,
  };
}
