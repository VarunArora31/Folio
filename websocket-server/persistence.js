import * as Y from "yjs";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

// Lazy connection — created on first use so dotenv is always loaded first
let _sql = null;
function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

/**
 * Load Y.js document state from database
 * @param {string} documentId
 * @returns {Promise<Uint8Array|null>}
 */
export async function loadDocument(documentId) {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT y_doc_state 
      FROM documents 
      WHERE id = ${documentId}
    `;

    if (result.length > 0 && result[0].y_doc_state) {
      console.log(`[Persistence] Loaded document ${documentId} from DB`);
      return new Uint8Array(result[0].y_doc_state);
    }

    console.log(`[Persistence] No saved state for document ${documentId}`);
    return null;
  } catch (error) {
    console.error(`[Persistence] Failed to load document ${documentId}:`, error.message);
    return null;
  }
}

/**
 * Save Y.js document state to database
 * @param {string} documentId
 * @param {Uint8Array} state - Encoded Y.js document state
 * @returns {Promise<boolean>}
 */
export async function saveDocument(documentId, state) {
  try {
    const sql = getSql();
    await sql`
      UPDATE documents 
      SET 
        y_doc_state = ${Buffer.from(state)},
        doc_version = doc_version + 1,
        updated_at = NOW()
      WHERE id = ${documentId}
    `;

    console.log(`[Persistence] Saved document ${documentId} to DB`);
    return true;
  } catch (error) {
    console.error(`[Persistence] Failed to save document ${documentId}:`, error.message);
    return false;
  }
}

/**
 * Track active user session
 * @param {string} documentId
 * @param {string} userId
 * @param {object} userInfo - {name, email, avatarUrl}
 * @returns {Promise<string>} sessionId
 */
export async function createSession(documentId, userId, userInfo) {
  try {
    const sessionId = `${userId}_${Date.now()}`;
    const sql = getSql();
    await sql`
      INSERT INTO document_sessions (id, document_id, user_id, user_name, user_email, user_avatar_url)
      VALUES (${sessionId}, ${documentId}, ${userId}, ${userInfo.name}, ${userInfo.email}, ${userInfo.avatarUrl})
      ON CONFLICT (id) 
      DO UPDATE SET last_seen = NOW()
    `;

    console.log(`[Persistence] Created session ${sessionId} for user ${userId}`);
    return sessionId;
  } catch (error) {
    console.error("[Persistence] Failed to create session:", error.message);
    return null;
  }
}

/**
 * Update session last seen timestamp
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function updateSession(sessionId) {
  try {
    const sql = getSql();
    await sql`
      UPDATE document_sessions 
      SET last_seen = NOW()
      WHERE id = ${sessionId}
    `;
    return true;
  } catch (error) {
    console.error("[Persistence] Failed to update session:", error.message);
    return false;
  }
}

/**
 * Remove session when user disconnects
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function removeSession(sessionId) {
  try {
    const sql = getSql();
    await sql`
      DELETE FROM document_sessions 
      WHERE id = ${sessionId}
    `;

    console.log(`[Persistence] Removed session ${sessionId}`);
    return true;
  } catch (error) {
    console.error("[Persistence] Failed to remove session:", error.message);
    return false;
  }
}

/**
 * Get all active sessions for a document
 * @param {string} documentId
 * @returns {Promise<Array>}
 */
export async function getActiveSessions(documentId) {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT id, user_id, user_name, user_email, user_avatar_url, connected_at, last_seen
      FROM document_sessions
      WHERE document_id = ${documentId}
      AND last_seen > NOW() - INTERVAL '5 minutes'
      ORDER BY connected_at ASC
    `;

    return result;
  } catch (error) {
    console.error("[Persistence] Failed to get active sessions:", error.message);
    return [];
  }
}

/**
 * Clean up stale sessions (older than 5 minutes)
 * @returns {Promise<number>} Number of sessions removed
 */
export async function cleanupStaleSessions() {
  try {
    const sql = getSql();
    const result = await sql`
      DELETE FROM document_sessions
      WHERE last_seen < NOW() - INTERVAL '5 minutes'
    `;

    if (result.count > 0) {
      console.log(`[Persistence] Cleaned up ${result.count} stale sessions`);
    }
    return result.count;
  } catch (error) {
    console.error("[Persistence] Failed to cleanup stale sessions:", error.message);
    return 0;
  }
}
