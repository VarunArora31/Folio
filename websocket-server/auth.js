import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Validates a Clerk session token from WebSocket connection
 * @param {string} token - Session token from client
 * @returns {Promise<{userId: string, email: string} | null>}
 */
export async function validateToken(token) {
  if (!token) {
    console.log("[Auth] No token provided");
    return null;
  }

  try {
    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(token, token);
    
    if (!session || !session.userId) {
      console.log("[Auth] Invalid session");
      return null;
    }

    // Fetch user details
    const user = await clerkClient.users.getUser(session.userId);

    return {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username || "Anonymous",
      avatarUrl: user.imageUrl,
    };
  } catch (error) {
    console.error("[Auth] Token validation failed:", error.message);
    return null;
  }
}

/**
 * Checks if user has access to a document
 * @param {object} db - Database connection
 * @param {string} userId - Clerk user ID
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>}
 */
export async function canAccessDocument(db, userId, documentId) {
  try {
    // Check if user is owner or collaborator
    const result = await db.query(
      `SELECT EXISTS(
        SELECT 1 FROM documents WHERE id = $1 AND owner_id = $2
        UNION
        SELECT 1 FROM document_collaborators WHERE document_id = $1 AND user_id = $2
      ) as has_access`,
      [documentId, userId]
    );

    return result.rows[0]?.has_access || false;
  } catch (error) {
    console.error("[Auth] Access check failed:", error.message);
    return false;
  }
}
