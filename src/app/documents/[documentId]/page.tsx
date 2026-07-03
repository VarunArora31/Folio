import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { documents, documentCollaborators } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { Editor } from "./editor";
import { Toolbar } from "./toolbar";
import { Navbar } from "./navbar";
import { Ruler } from "./ruler";

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
    <div className="min-h-screen flex flex-col" style={{ background: "#e8e6e1" }}>
      {/* Top navigation */}
      <Navbar documentId={documentId} initialTitle={doc.title} />

      {/* Toolbar */}
      <div id="toolbar-container" className="sticky top-0 z-10 border-b px-2 sm:px-4 py-0.5 sm:py-1 print:hidden"
        style={{ background: "#2c2c2e", borderColor: "#3a3a3c" }}>
        <Toolbar />
      </div>

      {/* Margin ruler */}
      <Ruler />

      {/* Editor — loads real content, auto-saves on change */}
      <Editor
        documentId={documentId}
        initialContent={doc.content}
        initialTitle={doc.title}
      />
    </div>
  );
};

export default DocumentIdPage;
