import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { documents, documentCollaborators } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DocumentShell } from "./document-shell";

interface DocumentIdPageProps {
  params: Promise<{ documentId: string }>;
}

const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
  const { documentId } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  // Fetch document directly from DB (server component — no API round-trip needed)
  const [doc] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.isDeleted, false)
      )
    )
    .limit(1);

  if (!doc) notFound();

  // Check access — owner or collaborator
  const isOwner = doc.ownerId === userId;

  if (!isOwner) {
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

    if (!collab) notFound(); // no access → 404 (don't leak doc existence)
  }

  // Update lastOpenedAt in background (fire and forget)
  db.update(documents)
    .set({ lastOpenedAt: new Date() })
    .where(eq(documents.id, documentId))
    .catch(() => {}); // non-critical

  return (
    <DocumentShell
      documentId={documentId}
      initialTitle={doc.title}
      initialContent={doc.content}
    />
  );
};

export default DocumentIdPage;
