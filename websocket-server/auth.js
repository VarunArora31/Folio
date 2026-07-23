import { createClerkClient, verifyToken } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

let _clerkClient = null;
function getClerkClient() {
  if (!_clerkClient) {
    _clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }
  return _clerkClient;
}

let _sql = null;
function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

/**
 * Validates a Clerk JWT token using verifyToken with the secret key.
 * getToken() on the client returns a short-lived JWT signed by Clerk.
 */
export async function validateToken(token) {
  if (!token) {
    console.log("[Auth] No token provided");
    return null;
  }

  try {
    const clerk = getClerkClient();

    // verifyToken is a standalone function, not a method on the client
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      console.log("[Auth] No subject in token");
      return null;
    }

    const user = await clerk.users.getUser(payload.sub);
    console.log(`[Auth] Validated user: ${user.id}`);

    return {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.username || user.emailAddresses[0]?.emailAddress || "Anonymous",
      avatarUrl: user.imageUrl,
    };
  } catch (error) {
    console.error("[Auth] Token validation failed:", error.message);
    return null;
  }
}

export async function canAccessDocument(userId, documentId) {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT EXISTS(
        SELECT 1 FROM documents
          WHERE id = ${documentId} AND owner_id = ${userId} AND is_deleted = false
        UNION
        SELECT 1 FROM document_collaborators
          WHERE document_id = ${documentId} AND user_id = ${userId}
      ) AS has_access
    `;
    return result[0]?.has_access === true;
  } catch (error) {
    console.error("[Auth] Access check failed:", error.message);
    return false;
  }
}
