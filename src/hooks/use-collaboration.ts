"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import * as Y from "yjs";

export interface CollaborationUser {
  userId: string;
  name: string;
  color: string;
}

export interface UseCollaborationOptions {
  documentId: string;
  enabled?: boolean;
}

export interface UseCollaborationReturn {
  ydoc: Y.Doc | null;
  provider: CustomProvider | null;
  isConnected: boolean;
  isSynced: boolean;
  activeUsers: CollaborationUser[];
  error: string | null;
}

// ── Minimal custom WebSocket provider ────────────────────────────────────────
// We roll our own instead of y-websocket to avoid its URL-param token caching
// and to support message-based auth (fresh token on every connect).

export class CustomProvider {
  ydoc: Y.Doc;
  awareness: SimpleAwareness;
  ws: WebSocket | null = null;
  private wsUrl: string;
  private documentId: string;
  private getToken: () => Promise<string | null>;
  private onStatusChange: (connected: boolean) => void;
  private onSyncChange: (synced: boolean) => void;
  private onAwarenessChange: (users: CollaborationUser[]) => void;
  private shouldConnect = true;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;

  constructor(
    wsUrl: string,
    documentId: string,
    ydoc: Y.Doc,
    getToken: () => Promise<string | null>,
    callbacks: {
      onStatusChange: (connected: boolean) => void;
      onSyncChange: (synced: boolean) => void;
      onAwarenessChange: (users: CollaborationUser[]) => void;
    }
  ) {
    this.wsUrl = wsUrl;
    this.documentId = documentId;
    this.ydoc = ydoc;
    this.getToken = getToken;
    this.onStatusChange = callbacks.onStatusChange;
    this.onSyncChange = callbacks.onSyncChange;
    this.onAwarenessChange = callbacks.onAwarenessChange;
    this.awareness = new SimpleAwareness(ydoc);

    // Listen for local doc updates and send to server
    this.ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== this && this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: "update", data: Array.from(update) });
      }
    });

    this.connect();
  }

  private async connect() {
    if (!this.shouldConnect) return;

    // Get a fresh token every time we connect — avoids expiry
    const token = await this.getToken();
    if (!token) {
      console.error("[Collab] No auth token available");
      this.scheduleReconnect();
      return;
    }

    const url = `${this.wsUrl}?documentId=${encodeURIComponent(this.documentId)}`;
    console.log("[Collab] Connecting to", url);

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      console.log("[Collab] WebSocket open, sending auth...");
      this.reconnectDelay = 1000;
      this.sendMessage({ type: "auth", token, documentId: this.documentId });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = (event) => {
      console.log(`[Collab] WebSocket closed — code: ${event.code}`);
      // Only update state if this is still the active socket
      if (this.ws !== ws) return;

      this.onStatusChange(false);
      this.onSyncChange(false);

      if (event.code === 1008) {
        console.error("[Collab] Auth rejected by server — stopping reconnect");
        this.shouldConnect = false;
        return;
      }

      this.scheduleReconnect();
    };

    ws.onerror = () => {
      // WebSocket errors are followed by a close event which handles reconnect.
      // We intentionally don't log here because the Event object isn't useful.
    };
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case "auth_ok":
        console.log("[Collab] Auth OK, connected as", msg.userId);
        (this as any)._currentUserId = msg.userId;
        this.onStatusChange(true);
        break;

      case "auth_error":
        console.error("[Collab] Auth error:", msg.reason);
        this.shouldConnect = false;
        this.ws?.close(1008);
        break;

      case "sync_response": {
        // Apply the full document state from server
        if (msg.state) {
          const state = new Uint8Array(msg.state as number[]);
          Y.applyUpdate(this.ydoc, state, this);
          this.onSyncChange(true);
        }
        break;
      }

      case "update": {
        // Apply incremental update from another client
        if (msg.data) {
          const update = new Uint8Array(msg.data as number[]);
          Y.applyUpdate(this.ydoc, update, this);
        }
        break;
      }

      case "awareness": {
        if (msg.users) {
          // Filter out current user — they're shown via UserButton already
          const others = (msg.users as CollaborationUser[]).filter(
            (u) => u.userId !== (this as any)._currentUserId
          );
          this.onAwarenessChange(others);
        }
        break;
      }
    }
  }

  sendMessage(msg: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private scheduleReconnect() {
    if (!this.shouldConnect) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    console.log(`[Collab] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // max 30s backoff
      this.connect();
    }, this.reconnectDelay);
  }

  updateAwareness(user: { name: string; color: string; userId: string }) {
    this.sendMessage({ type: "awareness_update", user });
  }

  destroy() {
    this.shouldConnect = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
    this.awareness.destroy();
  }
}

// ── Minimal awareness stub ────────────────────────────────────────────────────

class SimpleAwareness {
  clientID: number;
  private ydoc: Y.Doc;

  constructor(ydoc: Y.Doc) {
    this.ydoc = ydoc;
    this.clientID = ydoc.clientID;
  }

  getStates() {
    return new Map();
  }

  destroy() {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCollaboration({
  documentId,
  enabled = true,
}: UseCollaborationOptions): UseCollaborationReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<CustomProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const providerRef = useRef<CustomProvider | null>(null);
  const initializedRef = useRef(false);

  const initialize = useCallback(() => {
    if (initializedRef.current || !enabled || !documentId) return;
    initializedRef.current = true;

    const wsUrl = process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || "ws://localhost:1234";

    const p = new CustomProvider(
      wsUrl,
      documentId,
      ydoc,
      () => getTokenRef.current(),
      {
        onStatusChange: (connected) => {
          setIsConnected(connected);
          if (connected) setError(null);
          else setError(null); // don't show error on normal disconnect
        },
        onSyncChange: setIsSynced,
        onAwarenessChange: setActiveUsers,
      }
    );

    providerRef.current = p;
    setProvider(p);
  }, [documentId, enabled, ydoc]);

  useEffect(() => {
    // Small delay to let React StrictMode's first unmount complete
    // before we actually connect — prevents double-connection in dev
    const timer = setTimeout(() => {
      initialize();
    }, 50);

    return () => {
      clearTimeout(timer);
      providerRef.current?.destroy();
      providerRef.current = null;
      initializedRef.current = false;
    };
  }, [initialize]);

  return { ydoc, provider, isConnected, isSynced, activeUsers, error };
}
