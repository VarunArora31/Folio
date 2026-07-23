import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { documents, documentCollaborators, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DocumentShell } from "./document-shell";

interface DocumentIdPageProps {
  params: Promise<{ documentId: string }>;
}

const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
  const { documentId } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  // Auto-sync current user to DB if not present (webhook may not have fired)
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser) {
    try {
      const { createClerkClient } = await import("@clerk/backend");
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const clerkUser = await clerk.users.getUser(userId);
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        await db.insert(users).values({
          id: clerkUser.id,
          email,
          name,
          avatarUrl: clerkUser.imageUrl || null,
        }).onConflictDoNothing();
      }
    } catch {
      // Non-critical — proceed anyway
    }
  }

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isDeleted, false)))
    .limit(1);

  if (!doc) notFound();

  const isOwner = doc.ownerId === userId;
  let userRole: "owner" | "editor" | "viewer" | "commenter" = "viewer";

  if (isOwner) {
    userRole = "owner";
  } else {
    const [collab] = await db
      .select()
      .from(documentCollaborators)
      .where(
        and(
          eq(documentCollaborators.documentId, documentId),
          eq(documentCollaborators.userId, userId)
        )
      )
      .limit(1);

    if (!collab) notFound(); // no access → 404
    userRole = collab.role;
  }

  // Update lastOpenedAt in background
  db.update(documents)
    .set({ lastOpenedAt: new Date() })
    .where(eq(documents.id, documentId))
    .catch(() => {});

  return (
    <>
      <title>{doc.title || "Untitled Document"} — Folio</title>
      <DocumentShell
        documentId={documentId}
        initialTitle={doc.title}
        initialContent={doc.content}
        userRole={userRole}
      />
    </>
  );
};

export default DocumentIdPage;
