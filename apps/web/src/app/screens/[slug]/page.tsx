import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ScreenTile } from "@/components/screen-tile";
import { PaletteStrip } from "@/components/palette-strip";
import { TagPill } from "@/components/tag-pill";
import {
  findScreen,
  findSimilar,
  getAllCollections,
  getAllScreens,
} from "@inspo/db";
import {
  MACROSTRUCTURE_LABELS,
  type Macrostructure,
} from "@inspo/taxonomy";

export async function generateStaticParams() {
  const screens = await getAllScreens();
  return screens.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const screen = await findScreen(slug);
  if (!screen) return { title: "Not found" };
  return {
    title: screen.title,
    description: screen.description,
  };
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-x-4 border-b rule py-4 first:border-t">
      <dt className="text-meta">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function ScreenDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screen = await findScreen(slug);
  if (!screen) notFound();

  const macroLabel = screen.tags.macrostructure
    ? MACROSTRUCTURE_LABELS[screen.tags.macrostructure as Macrostructure]
    : null;

  const [similar, allCollections] = await Promise.all([
    findSimilar(screen.slug, 3),
    getAllCollections(),
  ]);

  const inCollections = allCollections.filter((c) =>
    c.screens.some((entry) => entry.slug === screen.slug),
  );

  return (
    <div>
      {/* Editorial caption ─────────────────────────────────── */}
      <div className="mx-auto max-w-[120rem] px-6 pt-12 sm:px-10 sm:pt-16">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">
              <Link
                href="/screens"
                className="hover:text-[var(--color-link)]"
              >
                ← Archive
              </Link>
            </p>
            <p className="text-meta mt-2">№ {screen.id}</p>
          </div>

          <div className="lg:col-span-10">
            <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
              {screen.title}
            </h1>
            <p className="mt-6 max-w-[58ch] text-lg text-[var(--color-fg-muted)]">
              {screen.description}
            </p>

            {/* Tag pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {macroLabel && (
                <TagPill label={macroLabel} variant="macro" />
              )}
              {screen.tags.style.map((s) => (
                <TagPill
                  key={s}
                  label={s.replace(/-/g, " ")}
                  href={`/screens?style=${s}`}
                />
              ))}
              {screen.tags.industry.map((i) => (
                <TagPill
                  key={i}
                  label={i.replace(/-/g, " ")}
                  href={`/screens?industry=${i}`}
                />
              ))}
              <TagPill label={screen.mode} />
            </div>
          </div>
        </div>
      </div>

      {/* Hero plate ────────────────────────────────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:mt-16 sm:px-10">
        <div className="overflow-hidden border rule">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.imageUrl}
            alt={screen.description}
            className="h-auto w-full"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="mt-3 flex items-baseline justify-between text-meta">
          <span>Hero — desktop · 1440 × 900</span>
          <a
            href={screen.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-link)]"
          >
            Visit source ↗
          </a>
        </div>
      </div>

      {/* Spec sheet + full page ───────────────────────────── */}
      <div className="mx-auto mt-24 max-w-[120rem] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-10">
          {/* Spec sheet */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <p className="text-meta">Spec sheet</p>
              <dl className="mt-4">
                <MetaRow label="Designer">
                  {screen.designerCredit ?? "—"}
                </MetaRow>
                <MetaRow label="Captured">
                  <time dateTime={screen.capturedAt}>{screen.capturedAt}</time>
                </MetaRow>
                <MetaRow label="Source">
                  <a
                    href={screen.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-link)]"
                  >
                    {new URL(screen.sourceUrl).host} ↗
                  </a>
                </MetaRow>
                <MetaRow label="Mode">{screen.mode}</MetaRow>
                {macroLabel && (
                  <MetaRow label="Macrostructure">{macroLabel}</MetaRow>
                )}
                <MetaRow label="Typefaces">
                  <ul className="space-y-1">
                    {screen.fonts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </MetaRow>
                <MetaRow label="Stack">
                  <ul className="flex flex-wrap gap-x-3 gap-y-1">
                    {screen.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </MetaRow>
                <MetaRow label="Palette">
                  <PaletteStrip palette={screen.palette} size="sm" showHex={false} />
                </MetaRow>
              </dl>

              {inCollections.length > 0 && (
                <div className="mt-10 space-y-2">
                  <p className="text-meta">Appears in</p>
                  {inCollections.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/collections/${c.slug}`}
                      className="block text-sm hover:text-[var(--color-link)]"
                    >
                      Issue Nº{c.number} — {c.title} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Full-page scroll viewer */}
          <div className="lg:col-span-8">
            <p className="text-meta mb-3">Full page — scroll to view</p>
            <div className="max-h-[80vh] overflow-y-auto border rule">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screen.fullPageUrl}
                alt={`${screen.title} — full page scroll`}
                className="block w-full"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-meta mt-3 italic">
              Placeholder — real captures land with Task 3 (the worker).
            </p>
          </div>
        </div>
      </div>

      {/* Palette band ─────────────────────────────────────── */}
      <div className="mx-auto mt-24 max-w-[120rem] border-y rule px-6 py-10 sm:px-10">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">Palette</p>
          <div className="lg:col-span-10">
            <PaletteStrip palette={screen.palette} size="lg" />
          </div>
        </div>
      </div>

      {/* Similar ──────────────────────────────────────────── */}
      <div className="mx-auto mt-24 max-w-[120rem] px-6 pb-24 sm:px-10">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Adjacent</p>
            <p className="text-meta mt-2 max-w-[20ch]">
              Sites that share this {macroLabel ? "macrostructure" : "vibe"}.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
            {similar.map((s) => (
              <li key={s.slug}>
                <ScreenTile screen={s} variant="hero" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
