/**
 * Drizzle schema — Postgres + pgvector.
 *
 * The data model the worker writes, the gallery reads, and the MCP
 * server queries. Tag values are validated against the allow-lists
 * in `@inspo/taxonomy` before insert.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import type { Mode } from "@inspo/taxonomy";

/* ───────────────────────── screens ───────────────────────── */

export const screens = pgTable(
  "screens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    designerCredit: text("designer_credit"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    description: text("description").notNull().default(""),
    altText: text("alt_text").notNull().default(""),
    searchKeywords: jsonb("search_keywords")
      .$type<string[]>()
      .notNull()
      .default([]),

    palette: jsonb("palette").$type<string[]>().notNull().default([]),
    fonts: jsonb("fonts").$type<string[]>().notNull().default([]),
    tech: jsonb("tech").$type<string[]>().notNull().default([]),
    mode: text("mode").$type<Mode>().notNull().default("light"),

    // Hallmark vocabulary (denormalized for filter speed)
    macrostructure: text("macrostructure"),
    hallmarkTheme: text("hallmark_theme"),

    // Image asset keys (R2 paths or absolute URLs)
    heroImageKey: text("hero_image_key"),
    fullImageKey: text("full_image_key"),
    thumbImageKey: text("thumb_image_key"),

    // Vectors — Voyage multimodal-3 = 1024
    embeddingImage: vector("embedding_image", { dimensions: 1024 }),
    embeddingText: vector("embedding_text", { dimensions: 1024 }),

    status: text("status")
      .$type<"pending" | "published" | "rejected">()
      .notNull()
      .default("pending"),
    curatorNote: text("curator_note"),
  },
  (t) => ({
    statusIdx: index("screens_status_idx").on(t.status),
    capturedIdx: index("screens_captured_at_idx").on(t.capturedAt),
    macroIdx: index("screens_macrostructure_idx").on(t.macrostructure),
    // Approximate-NN indexes for vectors — created in raw SQL migration
    // since drizzle-kit's vector index support is still maturing.
  }),
);

/* ───────────────────────── tags ───────────────────────── */

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  kind: text("kind")
    .$type<"style" | "industry" | "component" | "vibe" | "color" | "macrostructure" | "hallmark-theme">()
    .notNull(),
});

export const screenTags = pgTable(
  "screen_tags",
  {
    screenId: uuid("screen_id")
      .references(() => screens.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
    score: integer("score").notNull().default(100),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.screenId, t.tagId] }),
    tagIdx: index("screen_tags_tag_idx").on(t.tagId),
  }),
);

/* ───────────────────── collections (issues) ───────────────────── */

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  number: text("number").notNull(),
  date: text("date").notNull(),
  editorBlurb: text("editor_blurb").notNull().default(""),
  coverScreenId: uuid("cover_screen_id").references(() => screens.id, {
    onDelete: "set null",
  }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const collectionScreens = pgTable(
  "collection_screens",
  {
    collectionId: uuid("collection_id")
      .references(() => collections.id, { onDelete: "cascade" })
      .notNull(),
    screenId: uuid("screen_id")
      .references(() => screens.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").notNull(),
    span: integer("span").notNull().default(2),
    editorNote: text("editor_note"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.collectionId, t.screenId] }),
    posIdx: index("collection_screens_pos_idx").on(t.collectionId, t.position),
  }),
);

/* ───────────────────────── captures ───────────────────────── */

export const captures = pgTable(
  "captures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    screenId: uuid("screen_id")
      .references(() => screens.id, { onDelete: "cascade" })
      .notNull(),
    viewport: text("viewport")
      .$type<"desktop" | "tablet" | "mobile">()
      .notNull(),
    fullPage: boolean("full_page").notNull().default(false),
    imageKey: text("image_key").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    screenIdx: index("captures_screen_idx").on(t.screenId),
  }),
);

/* ───────────────────────── users / auth ───────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role")
    .$type<"member" | "curator" | "admin">()
    .notNull()
    .default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    keyHash: text("key_hash").notNull().unique(),
    label: text("label").notNull().default("default"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("api_keys_user_idx").on(t.userId),
  }),
);

export const searchLogs = pgTable("search_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  query: text("query").notNull(),
  filters: jsonb("filters").$type<Record<string, unknown>>().default({}),
  resultCount: integer("result_count").notNull(),
  source: text("source").$type<"web" | "mcp">().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ───────────────── extension SQL helpers ───────────────── */

/** Run once when initializing a fresh database. */
export const enableExtensions = sql`CREATE EXTENSION IF NOT EXISTS vector;`;

export type ScreenRow = typeof screens.$inferSelect;
export type NewScreenRow = typeof screens.$inferInsert;
export type CollectionRow = typeof collections.$inferSelect;
