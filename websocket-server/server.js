import { WebSocketServer } from "ws";
import * as Y from "yjs";
import dotenv from "dotenv";
import { validateToken, canAccessDocument } from "./auth.js";
import {
  loadDocument,
  saveDocument,
  createSession,
  removeSession,
  cleanupStaleSessions,
} from "./persistence.js";

dotenv.config();

const PORT = process.env.PORT || 1234;
const PERSISTENCE_DEBOUNCE_MS = parseInt(process.env.PERSISTENCE_DEBOUNCE_MS) || 5000;
const PERSISTENCE_MAX_INTERVAL_MS = parseInt(process.env.PERSISTENCE_MAX_INTERVAL_MS) || 30000;
const AUTH_TIMEOUT_MS = 10000; // 10s to send auth message

// ── Document Room ─────────────────────────────────────────────────────────────

class DocumentRoom {
  constructor(documentId) {
    this.documentId = documentId;
    this.ydoc = new Y.Doc();
    this.connections = new Map(); // clientId → { ws, userId, sessionId, userInfo }

    this.saveTimeout = null;
    this.lastSaveTime = Date.now();
    this.pendingChanges = false;
    this.isSaving = false;
    this.isLoaded = false;

    // Listen for local updates to broadcast to other clients
    this.ydoc.on("update", (update, origin) => {
      if (origin === "load") return;
      this.pendingChanges = true;
      this.scheduleSave();
      this.broadcastUpdate(update, origin);
    });
  }

  async initialize() {
    if (this.isLoaded) return;
    console.log(`[Room ${this.documentId}] Initializing...`);
    const savedState = await loadDocument(this.documentId);
    if (savedState) {
      Y.applyUpdate(this.ydoc, savedState, "load");
      console.log(`[Room ${this.documentId}] Loaded from DB`);
    } else {
      console.log(`[Room ${this.documentId}] Starting fresh`);
    }
    this.isLoaded = true;
  }

  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    const elapsed = Date.now() - this.lastSaveTime;
    if (elapsed >= PERSISTENCE_MAX_INTERVAL_MS) {
      this.persistToDatabase();
      return;
    }
    this.saveTimeout = setTimeout(() => this.persistToDatabase(), PERSISTENCE_DEBOUNCE_MS);
  }

  async persistToDatabase() {
    if (!this.pendingChanges || this.isSaving) return;
    this.isSaving = true;
    try {
      const state = Y.encodeStateAsUpdate(this.ydoc);
      const ok = await saveDocument(this.documentId, state);
      if (ok) {
        this.pendingChanges = false;
        this.lastSaveTime = Date.now();
        console.log(`[Room ${this.documentId}] Saved to DB`);
      }
    } catch (err) {
      console.error(`[Room ${this.documentId}] Save error:`, err.message);
    } finally {
      this.isSaving = false;
    }
  }

  broadcastUpdate(update, originWs) {
    const msg = JSON.stringify({ type: "update", data: Array.from(update) });
    this.connections.forEach((conn) => {
      if (conn.ws !== originWs && conn.ws.readyState === 1) {
        conn.ws.send(msg);
      }
    });
  }

  broadcastAwareness(excludeWs) {
    // Build unique user list — one entry per userId (not per connection)
    const seen = new Set();
    const users = [];
    this.connections.forEach((conn) => {
      if (!seen.has(conn.userInfo.userId)) {
        seen.add(conn.userInfo.userId);
        users.push({
          userId: conn.userInfo.userId,
          name: conn.userInfo.name,
          color: generateUserColor(conn.userInfo.userId),
        });
      }
    });

    const msg = JSON.stringify({ type: "awareness", users });
    this.connections.forEach((conn) => {
      if (conn.ws.readyState === 1) {
        conn.ws.send(msg);
      }
    });
  }

  async addConnection(ws, userId, userInfo) {
    await this.initialize();

    const clientId = generateClientId();
    const sessionId = await createSession(this.documentId, userId, userInfo).catch(() => null);

    this.connections.set(clientId, { ws, userId, sessionId, userInfo });

    console.log(`[Room ${this.documentId}] "${userInfo.name}" connected (${this.connections.size} total)`);

    // Send full document state to new client
    const state = Y.encodeStateAsUpdate(this.ydoc);
    ws.send(JSON.stringify({ type: "sync_response", state: Array.from(state) }));

    // Broadcast updated presence to everyone
    this.broadcastAwareness(null);

    return clientId;
  }

  removeConnection(clientId) {
    const conn = this.connections.get(clientId);
    if (!conn) return;

    this.connections.delete(clientId);
    if (conn.sessionId) removeSession(conn.sessionId).catch(() => {});

    console.log(`[Room ${this.documentId}] "${conn.userInfo.name}" disconnected (${this.connections.size} remaining)`);

    // Broadcast updated presence
    this.broadcastAwareness(null);

    if (this.connections.size === 0) this.persistToDatabase();
  }

  handleUpdate(clientId, update) {
    const conn = this.connections.get(clientId);
    if (!conn) return;
    // Apply update from client — triggers ydoc "update" event → broadcasts to others
    Y.applyUpdate(this.ydoc, update, conn.ws);
  }

  destroy() {
    this.connections.forEach((_, id) => this.removeConnection(id));
    this.ydoc.destroy();
  }
}

// ── Room Registry ─────────────────────────────────────────────────────────────

const rooms = new Map();

function getRoom(documentId) {
  if (!rooms.has(documentId)) rooms.set(documentId, new DocumentRoom(documentId));
  return rooms.get(documentId);
}

// ── WebSocket Server ──────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });
console.log(`🚀 Y.js Collaboration Server running on ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
  console.log("[Server] New connection");

  let authenticated = false;
  let clientId = null;
  let roomDocumentId = null;

  // Client must send auth message within 10s or get disconnected
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      console.log("[Server] Auth timeout — closing connection");
      ws.close(1008, "Auth timeout");
    }
  }, AUTH_TIMEOUT_MS);

  ws.on("message", async (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      ws.close(1003, "Invalid message format");
      return;
    }

    // ── Auth handshake ───────────────────────────────────────────────────────
    if (msg.type === "auth") {
      clearTimeout(authTimeout);
      console.log("[Server] Auth message received, documentId:", msg.documentId);

      const { token, documentId } = msg;

      if (!documentId) {
        ws.send(JSON.stringify({ type: "auth_error", reason: "Missing documentId" }));
        ws.close(1008, "Missing documentId");
        return;
      }

      // Validate token — gets a FRESH token sent from the client
      const user = await validateToken(token);
      if (!user) {
        ws.send(JSON.stringify({ type: "auth_error", reason: "Invalid token" }));
        ws.close(1008, "Authentication failed");
        return;
      }

      // Check document access
      const hasAccess = await canAccessDocument(user.userId, documentId);
      if (!hasAccess) {
        ws.send(JSON.stringify({ type: "auth_error", reason: "Access denied" }));
        ws.close(1008, "Access denied");
        return;
      }

      // Auth successful
      authenticated = true;
      roomDocumentId = documentId;

      // Add to room — await before sending auth_ok so clientId is set
      // before any subsequent messages arrive
      const room = getRoom(documentId);
      clientId = await room.addConnection(ws, user.userId, user);

      // Send auth_ok AFTER room is ready — client will then send sync_request
      ws.send(JSON.stringify({ type: "auth_ok", userId: user.userId }));

      return;
    }

    // ── All other messages require auth ──────────────────────────────────────
    if (!authenticated || !roomDocumentId || !clientId) {
      ws.close(1008, "Not authenticated");
      return;
    }

    const room = rooms.get(roomDocumentId);
    if (!room) return;

    if (msg.type === "update" && msg.data) {
      room.handleUpdate(clientId, new Uint8Array(msg.data));
    }

    if (msg.type === "sync_request") {
      const state = Y.encodeStateAsUpdate(room.ydoc);
      ws.send(JSON.stringify({ type: "sync_response", state: Array.from(state) }));
    }
  });

  ws.on("close", (code, reason) => {
    console.log(`[Server] Connection closed — code: ${code}, reason: "${reason}", authenticated: ${authenticated}, clientId: ${clientId}`);
    clearTimeout(authTimeout);
    if (authenticated && roomDocumentId && clientId) {
      const room = rooms.get(roomDocumentId);
      if (room) {
        room.removeConnection(clientId);
        if (room.connections.size === 0) {
          setTimeout(() => {
            if (room.connections.size === 0) {
              room.destroy();
              rooms.delete(roomDocumentId);
              console.log(`[Server] Room ${roomDocumentId} destroyed`);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
  });

  ws.on("error", (err) => console.error("[Server] WS error:", err.message));
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

setInterval(() => cleanupStaleSessions().catch(() => {}), 60 * 1000);

process.on("SIGTERM", async () => {
  console.log("[Server] Shutting down...");
  await Promise.all(Array.from(rooms.values()).map((r) => r.persistToDatabase()));
  wss.close(() => process.exit(0));
});

// ── Utilities ─────────────────────────────────────────────────────────────────

function generateClientId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateUserColor(userId) {
  const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#FFA07A","#98D8C8","#F7DC6F","#BB8FCE","#85C1E2","#F8B739","#52B788"];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
