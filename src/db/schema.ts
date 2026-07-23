import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Custom bytea type (not exported in drizzle-orm 0.45.x) ───────────────────
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
});

// ── Enums ─────────────────────────────────────────────────────────────────────

export const documentRoleEnum = pgEnum("document_role", [
  "owner",
  "editor",
  "viewer",
  "commenter",
]);

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "member",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "document_shared",
  "document_comment",
  "document_mention",
  "org_invite",
]);

// ── Users ─────────────────────────────────────────────────────────────────────
// Mirrors Clerk user data — synced via Clerk webhook on user creation/update

export const users = pgTable("users", {
  // Use Clerk's user ID as primary key — keeps everything in sync
  id: text("id").primaryKey(), // clerk user id e.g. "user_2abc..."
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Organizations ─────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), // clerk org id e.g. "org_2abc..."
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logoUrl: text("logo_url"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Organization Members ──────────────────────────────────────────────────────

export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: orgRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ── Documents ─────────────────────────────────────────────────────────────────

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled Document"),

  // Content stored as Tiptap JSON string (legacy, kept for backward compatibility)
  content: text("content"),

  // Y.js collaboration state (binary encoded Y.js document)
  yDocState: bytea("y_doc_state"),
  
  // Document version counter (increments on each save)
  docVersion: integer("doc_version").notNull().default(0),

  // Owner is always a user
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Optional: document belongs to an org (null = personal doc)
  organizationId: text("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Template it was created from (null = blank)
  templateId: text("template_id"),

  // Soft delete
  isDeleted: boolean("is_deleted").notNull().default(false),

  // Collaborative margin ruler state
  leftMargin: integer("left_margin").notNull().default(56),
  rightMargin: integer("right_margin").notNull().default(56),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastOpenedAt: timestamp("last_opened_at").defaultNow().notNull(),
});

// ── Document Collaborators ────────────────────────────────────────────────────
// Who has access to a document beyond the owner

export const documentCollaborators = pgTable("document_collaborators", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: documentRoleEnum("role").notNull().default("viewer"),
  invitedById: text("invited_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Notifications ─────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  // Link to relevant resource
  documentId: text("document_id")
    .references(() => documents.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Document Sessions ─────────────────────────────────────────────────────────
// Tracks active users currently editing a document (for presence/awareness)

export const documentSessions = pgTable("document_sessions", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userName: text("user_name"),
  userEmail: text("user_email"),
  userAvatarUrl: text("user_avatar_url"),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  collaborations: many(documentCollaborators),
  orgMemberships: many(organizationMembers),
  notifications: many(notifications),
  sessions: many(documentSessions),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [organizations.createdById],
    references: [users.id],
  }),
  members: many(organizationMembers),
  documents: many(documents),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  collaborators: many(documentCollaborators),
  notifications: many(notifications),
  sessions: many(documentSessions),
}));

export const documentCollaboratorsRelations = relations(documentCollaborators, ({ one }) => ({
  document: one(documents, {
    fields: [documentCollaborators.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentCollaborators.userId],
    references: [users.id],
  }),
  invitedBy: one(users, {
    fields: [documentCollaborators.invitedById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [notifications.documentId],
    references: [documents.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));

export const documentSessionsRelations = relations(documentSessions, ({ one }) => ({
  document: one(documents, {
    fields: [documentSessions.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentSessions.userId],
    references: [users.id],
  }),
}));

// ── TypeScript types (inferred from schema) ───────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DocumentSession = typeof documentSessions.$inferSelect;
export type NewDocumentSession = typeof documentSessions.$inferInsert;
