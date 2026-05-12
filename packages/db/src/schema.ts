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
import type { ColorWord, Mode, TypeRole } from "@inspo/taxonomy";

/** One row in the `type_ramp` jsonb column — one role × its computed type tokens. */
export type TypeRampEntry = {
  role: TypeRole;
  family: string;
  sizePx: number;
  weight: number;
  lineHeight: number; // normalised to a unitless multiplier when possible
  letterSpacing: string; // raw CSS, e.g. "-0.02em"
};

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

    // Multi-page grouping. site_slug groups all captured pages of one
    // site (typically the hostname-derived slug of the homepage). For
    // existing rows this back-fills to the row's own slug. page_type
    // is decided at URL discovery (sitemap ranker) — see worker/discover.ts.
    siteSlug: text("site_slug"),
    pageType: text("page_type")
      .$type<
        | "landing"
        | "pricing"
        | "features"
        | "auth"
        | "about"
        | "blog"
        | "changelog"
        | "docs"
        | "other"
      >()
      .default("landing"),

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

    // Phase 2 — design-system extraction. All defaulted so existing rows
    // survive db:push without backfill; the worker fills them on next capture.
    typeRamp: jsonb("type_ramp").$type<TypeRampEntry[]>().notNull().default([]),
    spacingScale: jsonb("spacing_scale").$type<number[]>().notNull().default([]),
    radiusScale: jsonb("radius_scale").$type<number[]>().notNull().default([]),
    containerWidth: integer("container_width"),
    cssVariables: jsonb("css_variables")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    colorWords: jsonb("color_words").$type<ColorWord[]>().notNull().default([]),

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
    siteSlugIdx: index("screens_site_slug_idx").on(t.siteSlug),
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

/* ─────────── auth (Better Auth — Drizzle adapter) ───────────────
 * Column shapes follow Better Auth's defaults so its Drizzle adapter
 * picks them up without remapping. Custom fields (role) are declared
 * here AND in apps/web/src/lib/auth.ts via additionalFields.
 * Reference: https://www.better-auth.com/docs/adapters/drizzle
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role")
    .$type<"member" | "curator" | "admin">()
    .notNull()
    .default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("session_user_idx").on(t.userId) }),
);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─────────── API keys (our own table, joined to Better Auth user) ─ */

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(), // first 8 chars, shown to user
    label: text("label").notNull().default("default"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({ userIdx: index("api_keys_user_idx").on(t.userId) }),
);

export const searchLogs = pgTable("search_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
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
