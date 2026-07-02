import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, documentCollaborators } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

// ── Helper: check if user can access document ─────────────────────────────────

async function canAccess(documentId: string, userId: string) {
  // Check if owner
  const doc = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.isDeleted, false)
      )
    )
    .limit(1);

  if (!doc[0]) return { doc: null, role: null };

  if (doc[0].ownerId === userId) return { doc: doc[0], role: "owner" };

  // Check if collaborator
  const collab = await db
    .select()
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      )
    )
    .limit(1);

  if (collab[0]) return { doc: doc[0], role: collab[0].role };

  return { doc: doc[0], role: null };
}

// ── GET /api/documents/[documentId] ──────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const { doc, role } = await canAccess(documentId, userId);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Update lastOpenedAt
  await db
    .update(documents)
    .set({ lastOpenedAt: new Date() })
    .where(eq(documents.id, documentId));

  return NextResponse.json({ ...doc, role });
}

// ── PATCH /api/documents/[documentId] ────────────────────────────────────────
// Update title, content, or margins

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const { doc, role } = await canAccess(documentId, userId);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!role || role === "viewer" || role === "commenter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, leftMargin, rightMargin } = body;

  const updateData: Partial<typeof doc> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (leftMargin !== undefined) updateData.leftMargin = leftMargin;
  if (rightMargin !== undefined) updateData.rightMargin = rightMargin;

  const [updated] = await db
    .update(documents)
    .set(updateData)
    .where(eq(documents.id, documentId))
    .returning();

  return NextResponse.json(updated);
}

// ── DELETE /api/documents/[documentId] ───────────────────────────────────────
// Soft delete (only owner can delete)

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const { doc, role } = await canAccess(documentId, userId);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "owner") {
    return NextResponse.json({ error: "Only the owner can delete" }, { status: 403 });
  }

  await db
    .update(documents)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  return NextResponse.json({ success: true });
}
