/**
 * Idempotent seed — upserts every fixture screen + collection into the
 * database. Safe to re-run.
 *
 * Run: pnpm --filter @inspo/db db:seed
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { collections, screens } from "./fixtures";
import {
  collections as collectionsT,
  collectionScreens as collectionScreensT,
  screens as screensT,
} from "./schema";

config({ path: "../../.env" });
config({ path: "./.env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. See .env.example.");
    process.exit(1);
  }

  const db = drizzle(neon(url));

  console.log(`Seeding ${screens.length} screens…`);
  const slugToId = new Map<string, string>();

  for (const s of screens) {
    const existing = await db
      .select({ id: screensT.id })
      .from(screensT)
      .where(eq(screensT.slug, s.slug))
      .limit(1);

    const values = {
      slug: s.slug,
      title: s.title,
      sourceUrl: s.sourceUrl,
      designerCredit: s.designerCredit ?? null,
      capturedAt: new Date(s.capturedAt),
      description: s.description,
      altText: s.description,
      searchKeywords: [...s.tags.style, ...s.tags.industry, ...s.tags.vibe],
      palette: s.palette,
      fonts: s.fonts,
      tech: s.tech,
      mode: s.mode,
      macrostructure: s.tags.macrostructure ?? null,
      hallmarkTheme: s.tags.hallmarkTheme ?? null,
      heroImageKey: null,
      fullImageKey: null,
      thumbImageKey: null,
      status: "published" as const,
    };

    if (existing[0]) {
      await db
        .update(screensT)
        .set(values)
        .where(eq(screensT.id, existing[0].id));
      slugToId.set(s.slug, existing[0].id);
    } else {
      const inserted = await db.insert(screensT).values(values).returning({
        id: screensT.id,
      });
      slugToId.set(s.slug, inserted[0].id);
    }
    process.stdout.write(".");
  }
  console.log();

  console.log(`Seeding ${collections.length} collections…`);
  for (const c of collections) {
    const coverId = c.coverScreenSlug ? slugToId.get(c.coverScreenSlug) : null;

    const existing = await db
      .select({ id: collectionsT.id })
      .from(collectionsT)
      .where(eq(collectionsT.slug, c.slug))
      .limit(1);

    const values = {
      slug: c.slug,
      title: c.title,
      number: c.number,
      date: c.date,
      editorBlurb: c.editorBlurb,
      coverScreenId: coverId ?? null,
      publishedAt: new Date(),
    };

    let collectionId: string;
    if (existing[0]) {
      await db
        .update(collectionsT)
        .set(values)
        .where(eq(collectionsT.id, existing[0].id));
      collectionId = existing[0].id;
    } else {
      const inserted = await db
        .insert(collectionsT)
        .values(values)
        .returning({ id: collectionsT.id });
      collectionId = inserted[0].id;
    }

    // Reset the join rows for this collection — easier than diffing
    await db
      .delete(collectionScreensT)
      .where(eq(collectionScreensT.collectionId, collectionId));

    for (let i = 0; i < c.screens.length; i++) {
      const entry = c.screens[i];
      const screenId = slugToId.get(entry.slug);
      if (!screenId) {
        console.warn(`  skipping ${entry.slug} (not in screens fixture)`);
        continue;
      }
      await db.insert(collectionScreensT).values({
        collectionId,
        screenId,
        position: i,
        span: entry.span ?? 2,
        editorNote: entry.editorNote ?? null,
      });
    }
    console.log(`  ✓ ${c.slug}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
