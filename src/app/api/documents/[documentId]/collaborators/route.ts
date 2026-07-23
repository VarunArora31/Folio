import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, documentCollaborators, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── GET /api/documents/[documentId]/collaborators ─────────────────────────────
// List all collaborators on a document

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only owner can view collaborators
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isDeleted, false)))
    .limit(1);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const collabs = await db
    .select({
      id: documentCollaborators.id,
      role: documentCollaborators.role,
      createdAt: documentCollaborators.createdAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(documentCollaborators)
    .innerJoin(users, eq(documentCollaborators.userId, users.id))
    .where(eq(documentCollaborators.documentId, documentId));

  return NextResponse.json({ collaborators: collabs });
}

// ── POST /api/documents/[documentId]/collaborators ────────────────────────────
// Invite a user by email with a specific role

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, role } = body as { email: string; role: "editor" | "viewer" | "commenter" };

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  if (!["editor", "viewer", "commenter"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check requester is the owner
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isDeleted, false)))
    .limit(1);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find the user by email
  const [invitedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!invitedUser) {
    return NextResponse.json(
      { error: "No account found with that email. They need to sign up first." },
      { status: 404 }
    );
  }

  if (invitedUser.id === userId) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
  }

  // Check if already a collaborator — update role if so
  const [existing] = await db
    .select()
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, invitedUser.id)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(documentCollaborators)
      .set({ role })
      .where(eq(documentCollaborators.id, existing.id));

    return NextResponse.json({
      message: `Updated ${invitedUser.name || email}'s role to ${role}`,
      updated: true,
    });
  }

  // Add new collaborator
  await db.insert(documentCollaborators).values({
    id: nanoid(),
    documentId,
    userId: invitedUser.id,
    role,
    invitedById: userId,
  });

  return NextResponse.json({
    message: `${invitedUser.name || email} added as ${role}`,
    added: true,
  });
}

// ── DELETE /api/documents/[documentId]/collaborators ─────────────────────────
// Remove a collaborator

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collaboratorId } = await req.json();
  if (!collaboratorId) {
    return NextResponse.json({ error: "collaboratorId required" }, { status: 400 });
  }

  // Only owner can remove collaborators
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.isDeleted, false)))
    .limit(1);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db
    .delete(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.id, collaboratorId),
        eq(documentCollaborators.documentId, documentId)
      )
    );

  return NextResponse.json({ message: "Collaborator removed" });
}
