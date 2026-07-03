import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// This is a server-side redirect page — no UI rendered
// Visiting /documents/new creates a blank doc and redirects to it
export default async function NewDocumentPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Ensure user row exists (webhook fallback)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      id: userId,
      email: `${userId}@placeholder.local`,
    }).onConflictDoNothing();
  }

  // Create blank document
  const id = nanoid();
  await db.insert(documents).values({
    id,
    title: "Untitled Document",
    ownerId: userId,
    content: "<p></p>",
  });

  redirect(`/documents/${id}`);
}
