import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as mutex from "lib0/mutex";
import dotenv from "dotenv";
import { validateToken, canAccessDocument } from "./auth.js";
import {
  loadDocument,
  saveDocument,
  createSession,
  updateSession,
  removeSession,
  cleanupStaleSessions,
} from "./persistence.js";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const PORT = process.env.PORT || 1234;
const PERSISTENCE_DEBOUNCE_MS = parseInt(process.env.PERSISTENCE_DEBOUNCE_MS) || 5000;
const PERSISTENCE_MAX_INTERVAL_MS = parseInt(process.env.PERSISTENCE_MAX_INTERVAL_MS) || 30000;

// Database connection
const db = neon(process.env.DATABASE_URL);

// ── Document Room Management ──────────────────────────────────────────────────

class DocumentRoom {
  constructor(documentId) {
    this.documentId = documentId;
    this.ydoc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.ydoc);
    this.connections = new Map(); // clientId → { ws, userId, sessionId, userInfo }
    this.mux = mutex.createMutex();
    
    // Persistence state
    this.saveTimeout = null;
    this.lastSaveTime = Date.now();
    this.pendingChanges = false;
    this.isLoaded = false;

    this.setupHandlers();
  }

  setupHandlers() {
    // Listen for document updates to trigger persistence
    this.ydoc.on("update", (update, origin) => {
      // Don't save if update came from initial load
      if (origin !== "load") {
        this.pendingChanges = true;
        this.scheduleSave();
      }

      // Broadcast to all connected clients except origin
      this.broadcastUpdate(update, origin);
    });

    // Listen for awareness updates (cursors, selections)
    this.awareness.on("update", ({ added, updated, removed }) => {
      this.broadcastAwareness();
    });
  }

  async initialize() {
    if (this.isLoaded) return;

    console.log(`[Room ${this.documentId}] Initializing...`);

    // Load existing Y.js state from database
    const savedState = await loadDocument(this.documentId);
    if (savedState) {
      Y.applyUpdate(this.ydoc, savedState, "load");
      console.log(`[Room ${this.documentId}] Loaded from database`);
    } else {
      console.log(`[Room ${this.documentId}] Starting fresh`);
    }

    this.isLoaded = true;
  }

  scheduleSave() {
    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Force save if max interval exceeded
    if (timeSinceLastSave >= PERSISTENCE_MAX_INTERVAL_MS) {
      this.persistToDatabase();
      return;
    }

    // Otherwise debounce
    this.saveTimeout = setTimeout(() => {
      this.persistToDatabase();
    }, PERSISTENCE_DEBOUNCE_MS);
  }

  async persistToDatabase() {
    if (!this.pendingChanges) return;

    await mutex.lock(this.mux, async () => {
      const state = Y.encodeStateAsUpdate(this.ydoc);
      const success = await saveDocument(this.documentId, state);

      if (success) {
        this.pendingChanges = false;
        this.lastSaveTime = Date.now();
        console.log(`[Room ${this.documentId}] Persisted to database`);
      }
    });
  }

  broadcastUpdate(update, origin) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // Message type: sync
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    this.connections.forEach((conn, clientId) => {
      if (conn.ws !== origin && conn.ws.readyState === 1) {
        conn.ws.send(message, (err) => {
          if (err) console.error(`[Room ${this.documentId}] Broadcast error:`, err);
        });
      }
    });
  }

  broadcastAwareness() {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 1); // Message type: awareness
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        Array.from(this.awareness.getStates().keys())
      )
    );
    const message = encoding.toUint8Array(encoder);

    this.connections.forEach((conn) => {
      if (conn.ws.readyState === 1) {
        conn.ws.send(message);
      }
    });
  }

  async addConnection(ws, userId, userInfo) {
    await this.initialize();

    const clientId = generateClientId();
    const sessionId = await createSession(this.documentId, userId, userInfo);

    this.connections.set(clientId, { ws, userId, sessionId, userInfo });

    // Set awareness state for this user
    this.awareness.setLocalStateField(clientId, {
      user: {
        name: userInfo.name,
        color: generateUserColor(userId),
        userId: userId,
      },
    });

    console.log(
      `[Room ${this.documentId}] User ${userInfo.name} connected (${this.connections.size} total)`
    );

    // Send current document state to new client
    this.sendSyncStep1(ws, clientId);

    return { clientId, sessionId };
  }

  sendSyncStep1(ws, clientId) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // Message type: sync
    syncProtocol.writeSyncStep1(encoder, this.ydoc);
    ws.send(encoding.toUint8Array(encoder));

    // Send awareness states
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, 1);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        Array.from(this.awareness.getStates().keys())
      )
    );
    ws.send(encoding.toUint8Array(awarenessEncoder));
  }

  removeConnection(clientId) {
    const conn = this.connections.get(clientId);
    if (!conn) return;

    this.connections.delete(clientId);
    this.awareness.setLocalStateField(clientId, null);

    if (conn.sessionId) {
      removeSession(conn.sessionId);
    }

    console.log(
      `[Room ${this.documentId}] User ${conn.userInfo.name} disconnected (${this.connections.size} remaining)`
    );

    // If room is empty, persist and cleanup
    if (this.connections.size === 0) {
      console.log(`[Room ${this.documentId}] Room empty, persisting...`);
      this.persistToDatabase();
    }
  }

  handleMessage(clientId, message) {
    const conn = this.connections.get(clientId);
    if (!conn) return;

    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case 0: // Sync
        syncProtocol.readSyncMessage(decoder, encoding.createEncoder(), this.ydoc, conn.ws);
        break;

      case 1: // Awareness
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          decoding.readVarUint8Array(decoder),
          conn.ws
        );
        break;

      case 2: // Heartbeat
        updateSession(conn.sessionId);
        break;
    }
  }

  destroy() {
    this.connections.forEach((_, clientId) => {
      this.removeConnection(clientId);
    });
    this.ydoc.destroy();
    this.awareness.destroy();
  }
}

// ── Room Registry ─────────────────────────────────────────────────────────────

const rooms = new Map(); // documentId → DocumentRoom

function getRoom(documentId) {
  if (!rooms.has(documentId)) {
    rooms.set(documentId, new DocumentRoom(documentId));
  }
  return rooms.get(documentId);
}

// ── WebSocket Server ──────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Y.js Collaboration Server running on ws://localhost:${PORT}`);

wss.on("connection", async (ws, req) => {
  console.log("[Server] New connection attempt");

  // Parse URL parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const documentId = url.searchParams.get("documentId");
  const token = url.searchParams.get("token");

  // Validate required parameters
  if (!documentId) {
    console.log("[Server] Missing documentId");
    ws.close(1008, "Missing documentId");
    return;
  }

  // Authenticate user
  const user = await validateToken(token);
  if (!user) {
    console.log("[Server] Authentication failed");
    ws.close(1008, "Authentication failed");
    return;
  }

  // Check document access
  const hasAccess = await canAccessDocument(db, user.userId, documentId);
  if (!hasAccess) {
    console.log(`[Server] User ${user.userId} has no access to document ${documentId}`);
    ws.close(1008, "Access denied");
    return;
  }

  // Add to room
  const room = getRoom(documentId);
  const { clientId, sessionId } = await room.addConnection(ws, user.userId, user);

  // Handle messages
  ws.on("message", (data) => {
    room.handleMessage(clientId, new Uint8Array(data));
  });

  // Handle disconnect
  ws.on("close", () => {
    room.removeConnection(clientId);

    // Cleanup empty rooms after 5 minutes
    if (room.connections.size === 0) {
      setTimeout(() => {
        if (room.connections.size === 0) {
          console.log(`[Server] Destroying empty room ${documentId}`);
          room.destroy();
          rooms.delete(documentId);
        }
      }, 5 * 60 * 1000);
    }
  });

  ws.on("error", (error) => {
    console.error("[Server] WebSocket error:", error.message);
  });
});

// ── Cleanup & Health ──────────────────────────────────────────────────────────

// Cleanup stale sessions every minute
setInterval(() => {
  cleanupStaleSessions();
}, 60 * 1000);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received, shutting down gracefully...");

  // Persist all rooms
  const persistPromises = Array.from(rooms.values()).map((room) =>
    room.persistToDatabase()
  );
  await Promise.all(persistPromises);

  wss.close(() => {
    console.log("[Server] WebSocket server closed");
    process.exit(0);
  });
});

// ── Utilities ─────────────────────────────────────────────────────────────────

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUserColor(userId) {
  // Generate consistent color from userId
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
