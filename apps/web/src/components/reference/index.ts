/**
 * Hallmark-disciplined reference components.
 *
 * Each entry is a self-contained section authored to demonstrate ONE
 * macrostructure / archetype. Two entries in the same type group must
 * differ on at least one structural axis (paper band, display style,
 * accent application, or section count). The pages under
 * /components/[type] iterate this registry; the MCP tool surface can
 * read it too for "give me a hero example" prompts that hit before
 * any real-crop data is populated.
 *
 * Adding a new reference:
 *  1. Drop the file in /components/reference/<type>/<id>.tsx
 *  2. Stamp it: `Hallmark · component: <type> · ...`
 *  3. Register here. State the macrostructure + how it differs from
 *     its siblings in `note` — the page surfaces that note.
 */

import type { ComponentType } from "@inspo/shared";

import { HeroMarquee } from "./hero/marquee";
import { HeroStatLed } from "./hero/stat-led";
import { HeroManifesto } from "./hero/manifesto";

import { FooterColophon } from "./footer/colophon";
import { FooterStatement } from "./footer/statement";
import { FooterList } from "./footer/list";

import { CtaQuiet } from "./cta/quiet";
import { CtaBanded } from "./cta/banded";
import { CtaFormLed } from "./cta/form-led";

import { PricingThreeCard } from "./pricing/three-card";
import { PricingToggle } from "./pricing/toggle";
import { PricingTable } from "./pricing/table";

import { FeaturesBento } from "./features/bento";
import { FeaturesNumberedTriplet } from "./features/numbered-triplet";
import { FeaturesAlternating } from "./features/alternating";

import { NavInline } from "./nav/inline";
import { NavFloatingPill } from "./nav/floating-pill";
import { NavMarginal } from "./nav/marginal";

import { TestimonialPullQuote } from "./testimonial/pull-quote";
import { TestimonialMosaic } from "./testimonial/mosaic";
import { TestimonialCinematic } from "./testimonial/cinematic";

import { LogoCloudStrip } from "./logo-cloud/strip";
import { LogoCloudMarquee } from "./logo-cloud/marquee";

import { FaqAccordion } from "./faq/accordion";
import { FaqTwoColumn } from "./faq/two-column";
import { FaqNumbered } from "./faq/numbered";

import { StatRow } from "./stat/row";
import { StatSingleHero } from "./stat/single-hero";

export type Reference = {
  id: string;
  label: string;
  macro: string;
  note: string;
  Component: React.ComponentType;
};

export const REFERENCE: Partial<Record<ComponentType, Reference[]>> = {
  hero: [
    {
      id: "marquee",
      label: "Marquee",
      macro: "Marquee Hero",
      note: "One thought set big, with mono dateline as the editorial anchor. No imagery — the type is the design.",
      Component: HeroMarquee,
    },
    {
      id: "stat-led",
      label: "Stat-Led",
      macro: "Stat-Led",
      note: "The figure leads. Supporting copy sits right and pulls weight from the number. Use when the brief has a real number to lead with.",
      Component: HeroStatLed,
    },
    {
      id: "manifesto",
      label: "Manifesto",
      macro: "Manifesto",
      note: "Dark ground, single declaration, one phrase punched in accent. No CTA stack — the voice carries the brand.",
      Component: HeroManifesto,
    },
  ],
  footer: [
    {
      id: "colophon",
      label: "Colophon",
      macro: "Ft7 Colophon",
      note: "Magazine end-credit. Typefaces, stack, owner — set in mono so it reads as metadata, not body copy.",
      Component: FooterColophon,
    },
    {
      id: "statement",
      label: "Statement",
      macro: "Ft5 Statement",
      note: "One big sentence, one quiet sign-off. Lands the brand's last word on the page.",
      Component: FooterStatement,
    },
    {
      id: "list",
      label: "Index",
      macro: "Ft1 Index",
      note: "Hand-set table of contents at the foot — numbered, mono, no underlines. Reads as back-matter.",
      Component: FooterList,
    },
  ],
  cta: [
    {
      id: "quiet",
      label: "Quiet",
      macro: "Typographic CTA",
      note: "A typographic appeal, not a button. Reads as the end of an article, not a sales push.",
      Component: CtaQuiet,
    },
    {
      id: "banded",
      label: "Banded",
      macro: "Accent Band",
      note: "Full-bleed accent ribbon with one action. Earns its loudness by being the only one on the page.",
      Component: CtaBanded,
    },
    {
      id: "form-led",
      label: "Form-led",
      macro: "Inline Form",
      note: "The input is the action. Single email field with inline submit and a real success state.",
      Component: CtaFormLed,
    },
  ],
  pricing: [
    {
      id: "three-card",
      label: "Three-card",
      macro: "Horizontal plan trio",
      note: "Classic three tiers. The recommended one raised by a thin accent rule along the top — no \"Most popular\" badge.",
      Component: PricingThreeCard,
    },
    {
      id: "toggle",
      label: "Toggle",
      macro: "Cadence toggle + 2 plans",
      note: "Bipolar choice with monthly/annual flip. Segmented control with radio semantics.",
      Component: PricingToggle,
    },
    {
      id: "table",
      label: "Comparison table",
      macro: "Feature matrix",
      note: "Tabular spec sheet. Thin rules, no zebra striping, hover lift to track across rows.",
      Component: PricingTable,
    },
  ],
  features: [
    {
      id: "bento",
      label: "Bento",
      macro: "Bento Grid",
      note: "Six tiles, irregular spans. The largest carries the lead idea; smaller ones extend it.",
      Component: FeaturesBento,
    },
    {
      id: "numbered-triplet",
      label: "Numbered triplet",
      macro: "Process triplet",
      note: "Three equal columns prefaced by big mono ordinals. Variety comes from type, not layout.",
      Component: FeaturesNumberedTriplet,
    },
    {
      id: "alternating",
      label: "Alternating",
      macro: "Vertical stack with side flip",
      note: "Three feature rows alternating side per row. The shape comes from the alternation.",
      Component: FeaturesAlternating,
    },
  ],
  nav: [
    {
      id: "inline",
      label: "Inline minimal",
      macro: "N1 Inline",
      note: "Wordmark left, links inline, utilities right. The utility cluster sits tighter than the nav links.",
      Component: NavInline,
    },
    {
      id: "floating-pill",
      label: "Floating pill",
      macro: "N5 Floating pill",
      note: "Centred pill nav that doesn't sit on a full-width band. Good over full-bleed heroes.",
      Component: NavFloatingPill,
    },
    {
      id: "marginal",
      label: "Marginal",
      macro: "N7 Marginal",
      note: "Vertical index in the left margin. Reads like a table-of-contents pulled into the chrome.",
      Component: NavMarginal,
    },
  ],
  testimonial: [
    {
      id: "pull-quote",
      label: "Pull quote",
      macro: "Single voice",
      note: "One huge quote, single attribution. Voice as marketing. Placeholder slots — quotes are never invented.",
      Component: TestimonialPullQuote,
    },
    {
      id: "mosaic",
      label: "Mosaic",
      macro: "Quote grid",
      note: "Four cards, hover-lifted. Density that reads as range without picking one voice over another.",
      Component: TestimonialMosaic,
    },
    {
      id: "cinematic",
      label: "Cinematic",
      macro: "Dark band + credit roll",
      note: "Dark ground, single quote, attribution rendered as a film-credit row. Invites verbatim quotation.",
      Component: TestimonialCinematic,
    },
  ],
  "logo-cloud": [
    {
      id: "strip",
      label: "Strip",
      macro: "Single-row strip",
      note: "Wordmark logos in a typographic row, opacity-muted by default. No invented \"trusted by\" framing.",
      Component: LogoCloudStrip,
    },
    {
      id: "marquee",
      label: "Marquee",
      macro: "Infinite scroll",
      note: "Auto-scrolling wordmark loop with mask-faded edges. Pauses on hover and respects reduced-motion.",
      Component: LogoCloudMarquee,
    },
  ],
  faq: [
    {
      id: "accordion",
      label: "Accordion",
      macro: "Native <details> stack",
      note: "Native HTML, single-open behaviour. The affordance is a typographic + / —, not an SVG chevron.",
      Component: FaqAccordion,
    },
    {
      id: "two-column",
      label: "Two-column open",
      macro: "Q-left, A-right",
      note: "Every Q&A on display. Reads as a magazine Q&A interview, not a help-desk index.",
      Component: FaqTwoColumn,
    },
    {
      id: "numbered",
      label: "Numbered",
      macro: "Ordered manifesto FAQ",
      note: "Asked, briefly answered. Numbered prefix in mono — reads as a list of arguments.",
      Component: FaqNumbered,
    },
  ],
  stat: [
    {
      id: "row",
      label: "Stat row",
      macro: "4-stat row",
      note: "Four real catalogue numbers in a row, tabular-nums. Hallmark forbids invented stats — these are real.",
      Component: StatRow,
    },
    {
      id: "single-hero",
      label: "Single hero",
      macro: "One giant number",
      note: "One number, set as large as the page allows. Reach for when the strongest claim is countable and singular.",
      Component: StatSingleHero,
    },
  ],
};

export function getReferences(type: ComponentType): Reference[] {
  return REFERENCE[type] ?? [];
}
