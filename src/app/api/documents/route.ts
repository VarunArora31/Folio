import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { eq, desc, or, ilike, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── GET /api/documents ────────────────────────────────────────────────────────
// List all documents for the current user (with optional search)

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const orgId = searchParams.get("orgId") || null;

  const conditions = [
    eq(documents.ownerId, userId),
    eq(documents.isDeleted, false),
  ];

  // Filter by org or personal
  if (orgId) {
    conditions.push(eq(documents.organizationId, orgId));
  } else {
    conditions.push(isNull(documents.organizationId));
  }

  // Search by title
  if (search) {
    conditions.push(ilike(documents.title, `%${search}%`));
  }

  const docs = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.lastOpenedAt));

  return NextResponse.json(docs);
}

// ── POST /api/documents ───────────────────────────────────────────────────────
// Create a new document

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, orgId, templateId, initialContent } = body;

  // Ensure user exists in our DB (in case webhook hasn't fired yet)
  await ensureUserExists(userId);

  const id = nanoid();

  const [doc] = await db
    .insert(documents)
    .values({
      id,
      title: title || "Untitled Document",
      ownerId: userId,
      organizationId: orgId || null,
      templateId: templateId || null,
      content: initialContent || null,
    })
    .returning();

  return NextResponse.json(doc, { status: 201 });
}

// ── Helper: upsert user row ───────────────────────────────────────────────────
// Fallback in case the Clerk webhook hasn't synced the user yet

async function ensureUserExists(userId: string) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    // Insert a minimal row — webhook will fill in details later
    await db
      .insert(users)
      .values({
        id: userId,
        email: `${userId}@placeholder.local`,
      })
      .onConflictDoNothing();
  }
}
