/**
 * Hallmark-disciplined reference components.
 *
 * Each entry is a self-contained section authored to demonstrate ONE
 * macrostructure / archetype. Two entries in the same type group must
 * differ on at least one structural axis (paper band, display style,
 * accent application, or section count). The pages under
 * /components/[type] iterate this registry.
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
import { HeroDocumentary } from "./hero/documentary";
import { HeroSplitScreen } from "./hero/split-screen";
import { HeroWordAsArt } from "./hero/word-as-art";
import { HeroQuestion } from "./hero/question";

import { FooterColophon } from "./footer/colophon";
import { FooterStatement } from "./footer/statement";
import { FooterList } from "./footer/list";
import { FooterSitemap } from "./footer/sitemap";
import { FooterNewsletter } from "./footer/newsletter";
import { FooterAddress } from "./footer/address";
import { FooterLongCopy } from "./footer/long-copy";

import { CtaQuiet } from "./cta/quiet";
import { CtaBanded } from "./cta/banded";
import { CtaFormLed } from "./cta/form-led";
import { CtaInverted } from "./cta/inverted";
import { CtaTwoButton } from "./cta/two-button";
import { CtaMarquee } from "./cta/marquee";
import { CtaStickyCompact } from "./cta/sticky-compact";

import { PricingThreeCard } from "./pricing/three-card";
import { PricingToggle } from "./pricing/toggle";
import { PricingTable } from "./pricing/table";
import { PricingSinglePlan } from "./pricing/single-plan";
import { PricingPerUse } from "./pricing/per-use";
import { PricingTierBento } from "./pricing/tier-bento";
import { PricingEnterprise } from "./pricing/enterprise";

import { FeaturesBento } from "./features/bento";
import { FeaturesNumberedTriplet } from "./features/numbered-triplet";
import { FeaturesAlternating } from "./features/alternating";
import { FeaturesLongForm } from "./features/long-form";
import { FeaturesCompare } from "./features/compare";
import { FeaturesIconTrio } from "./features/icon-trio";
import { FeaturesWorkbench } from "./features/workbench";

import { NavInline } from "./nav/inline";
import { NavFloatingPill } from "./nav/floating-pill";
import { NavMarginal } from "./nav/marginal";
import { NavMega } from "./nav/mega";
import { NavOffCanvas } from "./nav/off-canvas";
import { NavBreadcrumb } from "./nav/breadcrumb";
import { NavSearchFirst } from "./nav/search-first";

import { TestimonialPullQuote } from "./testimonial/pull-quote";
import { TestimonialMosaic } from "./testimonial/mosaic";
import { TestimonialCinematic } from "./testimonial/cinematic";
import { TestimonialReviewsRow } from "./testimonial/reviews-row";
import { TestimonialConversation } from "./testimonial/conversation";
import { TestimonialPress } from "./testimonial/press";
import { TestimonialSinglePortrait } from "./testimonial/single-portrait";

import { LogoCloudStrip } from "./logo-cloud/strip";
import { LogoCloudMarquee } from "./logo-cloud/marquee";
import { LogoCloudSectioned } from "./logo-cloud/sectioned";
import { LogoCloudGrid } from "./logo-cloud/grid";
import { LogoCloudPillChips } from "./logo-cloud/pill-chips";
import { LogoCloudCredits } from "./logo-cloud/credits";

import { FaqAccordion } from "./faq/accordion";
import { FaqTwoColumn } from "./faq/two-column";
import { FaqNumbered } from "./faq/numbered";
import { FaqSearchLed } from "./faq/search-led";
import { FaqCategoryTabs } from "./faq/category-tabs";
import { FaqCompact } from "./faq/compact";
import { FaqWithCta } from "./faq/with-cta";

import { StatRow } from "./stat/row";
import { StatSingleHero } from "./stat/single-hero";
import { StatBarChart } from "./stat/bar-chart";
import { StatBeforeAfter } from "./stat/before-after";
import { StatAnnotated } from "./stat/annotated";
import { StatGrid } from "./stat/grid";

export type Reference = {
  id: string;
  label: string;
  macro: string;
  note: string;
  Component: React.ComponentType;
};

export const REFERENCE: Partial<Record<ComponentType, Reference[]>> = {
  hero: [
    { id: "marquee", label: "Marquee", macro: "Marquee Hero", note: "One thought set big, with a mono dateline as the editorial anchor. No imagery — the type is the design.", Component: HeroMarquee },
    { id: "stat-led", label: "Stat-Led", macro: "Stat-Led", note: "The figure leads. Supporting copy pulls weight from the number. Use when the brief has a real number.", Component: HeroStatLed },
    { id: "manifesto", label: "Manifesto", macro: "Manifesto", note: "Dark ground, single declaration, one phrase punched in accent. The voice carries the brand.", Component: HeroManifesto },
    { id: "documentary", label: "Documentary", macro: "Documentary", note: "Headline reads as the caption of a missing photograph; documentary credit sits in the margin.", Component: HeroDocumentary },
    { id: "split-screen", label: "Split-screen", macro: "Split-screen", note: "Typography on one half, atmospheric pure-CSS panel on the other. No image placeholder.", Component: HeroSplitScreen },
    { id: "word-as-art", label: "Word-as-art", macro: "Word-as-art", note: "One word, set to fill the viewport width. The page leads with a noun, not a sentence.", Component: HeroWordAsArt },
    { id: "question", label: "Question", macro: "Question", note: "Hero asks rather than tells. Useful when the brief is invitational; the answer is the rest of the page.", Component: HeroQuestion },
  ],
  footer: [
    { id: "colophon", label: "Colophon", macro: "Ft7 Colophon", note: "Magazine end-credit. Typefaces, stack, owner — set in mono so it reads as metadata, not body copy.", Component: FooterColophon },
    { id: "statement", label: "Statement", macro: "Ft5 Statement", note: "One big sentence, one quiet sign-off. Lands the brand's last word on the page.", Component: FooterStatement },
    { id: "list", label: "Index", macro: "Ft1 Index", note: "Hand-set table of contents. Reads as back-matter — numbered, mono, no underlines.", Component: FooterList },
    { id: "sitemap", label: "Sitemap", macro: "Ft3 Sitemap", note: "4-column link map. The most-AI-recognised footer shape; reserve for genuine docs roots or hubs.", Component: FooterSitemap },
    { id: "newsletter", label: "Newsletter", macro: "Ft6 Newsletter", note: "Subscribe is the only action that earns a row. Three minimal links underneath, not a four-column map.", Component: FooterNewsletter },
    { id: "address", label: "Address card", macro: "Ft8 Address", note: "Real-world contact info — postal, email, hours. No social row, no link map.", Component: FooterAddress },
    { id: "long-copy", label: "Long copy", macro: "Manifesto in miniature", note: "Closes the page with a small essay rather than a link map. Voice as last word.", Component: FooterLongCopy },
  ],
  cta: [
    { id: "quiet", label: "Quiet", macro: "Typographic CTA", note: "A typographic appeal, not a button. Reads as the end of an article.", Component: CtaQuiet },
    { id: "banded", label: "Banded", macro: "Accent Band", note: "Full-bleed accent ribbon with one action. Earns its loudness by being the only one on the page.", Component: CtaBanded },
    { id: "form-led", label: "Form-led", macro: "Inline Form", note: "The input is the action. Single email field with inline submit and a real success state.", Component: CtaFormLed },
    { id: "inverted", label: "Inverted", macro: "Ink ground", note: "Black ground, paper button. The contrast does the work — no accent, no gradient, no chrome.", Component: CtaInverted },
    { id: "two-button", label: "Two-button", macro: "Primary + ghost", note: "Primary action + a quiet secondary. Don't add a third — the page becomes a comparison, not a conversion.", Component: CtaTwoButton },
    { id: "marquee", label: "Marquee", macro: "Motion-led", note: "A single phrase scrolls on infinite loop; the whole strip is clickable. Pauses on hover.", Component: CtaMarquee },
    { id: "sticky-compact", label: "Sticky compact", macro: "Floating row", note: "Low-contrast strip that floats at the foot; single short action.", Component: CtaStickyCompact },
  ],
  pricing: [
    { id: "three-card", label: "Three-card", macro: "Horizontal plan trio", note: "Classic three tiers. The recommended one raised by a thin accent rule — no \"Most popular\" badge.", Component: PricingThreeCard },
    { id: "toggle", label: "Toggle", macro: "Cadence toggle + 2 plans", note: "Bipolar choice with monthly/annual flip. Segmented control with radio semantics.", Component: PricingToggle },
    { id: "table", label: "Comparison table", macro: "Feature matrix", note: "Tabular spec sheet. Thin rules, no zebra striping, hover lift to track across rows.", Component: PricingTable },
    { id: "single-plan", label: "Single plan", macro: "Single focus", note: "One plan, no comparison. The page IS the plan. Reads as a brochure.", Component: PricingSinglePlan },
    { id: "per-use", label: "Per-use", macro: "Line items", note: "Pay-per-call menu rather than tiered plans. Reads as a menu, not a comparison.", Component: PricingPerUse },
    { id: "tier-bento", label: "Tier bento", macro: "Irregular bento", note: "Lead tier spans 2×2; supporting tiers smaller. Visual hierarchy expresses the recommendation.", Component: PricingTierBento },
    { id: "enterprise", label: "Enterprise", macro: "Contact-led", note: "No prices visible. What's covered, what's negotiable, where to reach.", Component: PricingEnterprise },
  ],
  features: [
    { id: "bento", label: "Bento", macro: "Bento Grid", note: "Six tiles, irregular spans. The largest carries the lead idea; smaller ones extend it.", Component: FeaturesBento },
    { id: "numbered-triplet", label: "Numbered triplet", macro: "Process triplet", note: "Three equal columns prefaced by big mono ordinals. Variety comes from type, not layout.", Component: FeaturesNumberedTriplet },
    { id: "alternating", label: "Alternating", macro: "Vertical with side flip", note: "Three feature rows alternating side per row. The shape comes from the alternation.", Component: FeaturesAlternating },
    { id: "long-form", label: "Long-form", macro: "Essay rows", note: "Features written as paragraphs with marginal headings. Read, not scanned.", Component: FeaturesLongForm },
    { id: "compare", label: "Compare", macro: "Before / with", note: "Capability comparison framed categorically (before / with) — no competitor names.", Component: FeaturesCompare },
    { id: "icon-trio", label: "Icon trio", macro: "Three primitives", note: "Three features each carrying a typographic mark inside a hairline square. No SVG iconography.", Component: FeaturesIconTrio },
    { id: "workbench", label: "Workbench", macro: "Copy + demo", note: "Explanatory copy left, working demo right. Real strings, no faux chrome.", Component: FeaturesWorkbench },
  ],
  nav: [
    { id: "inline", label: "Inline minimal", macro: "N1 Inline", note: "Wordmark left, links inline, utilities right. Utility cluster sits tighter than the nav links.", Component: NavInline },
    { id: "floating-pill", label: "Floating pill", macro: "N5 Floating pill", note: "Centred pill nav that doesn't sit on a full-width band. Good over full-bleed heroes.", Component: NavFloatingPill },
    { id: "marginal", label: "Marginal", macro: "N7 Marginal", note: "Vertical index in the left margin. Reads like a table-of-contents pulled into the chrome.", Component: NavMarginal },
    { id: "mega", label: "Mega menu", macro: "N3 Mega", note: "Top-level links reveal a multi-column panel on hover. For deep sites where flyouts get unwieldy.", Component: NavMega },
    { id: "off-canvas", label: "Off-canvas", macro: "N4 Drawer", note: "Page leads with the wordmark and a menu affordance; full nav slides in from the right.", Component: NavOffCanvas },
    { id: "breadcrumb", label: "Breadcrumb-led", macro: "N8 Breadcrumb", note: "Path is the primary nav. For deep hierarchies — docs, atlases, catalogue subsections.", Component: NavBreadcrumb },
    { id: "search-first", label: "Search-first", macro: "N9 Search-first", note: "The search input IS the nav row. Common in archives and ⌘K-led products.", Component: NavSearchFirst },
  ],
  testimonial: [
    { id: "pull-quote", label: "Pull quote", macro: "Single voice", note: "One huge quote, single attribution. Voice as marketing. Placeholder slots — quotes are never invented.", Component: TestimonialPullQuote },
    { id: "mosaic", label: "Mosaic", macro: "Quote grid", note: "Four cards, hover-lifted. Density that reads as range without picking one voice over another.", Component: TestimonialMosaic },
    { id: "cinematic", label: "Cinematic", macro: "Dark band + credit roll", note: "Dark ground, single quote, attribution as film-credit row. Invites verbatim quotation.", Component: TestimonialCinematic },
    { id: "reviews-row", label: "Reviews row", macro: "Star + short quote", note: "Three star reviews with one-line quotes. Counts placeholdered — no invented review totals.", Component: TestimonialReviewsRow },
    { id: "conversation", label: "Conversation", macro: "Chat snippet", note: "Three lines of dialogue. Invites the reader to overhear rather than be sold to.", Component: TestimonialConversation },
    { id: "press", label: "Press quote", macro: "Outlet credit", note: "Single press mention with byline + outlet. Placeholder slots — never invent press.", Component: TestimonialPress },
    { id: "single-portrait", label: "Single portrait", macro: "Face + voice", note: "One face, one voice. Portrait slot is bordered placeholder; replace with real photograph.", Component: TestimonialSinglePortrait },
  ],
  "logo-cloud": [
    { id: "strip", label: "Strip", macro: "Single-row strip", note: "Wordmark logos in a typographic row, opacity-muted. No invented \"trusted by\" framing.", Component: LogoCloudStrip },
    { id: "marquee", label: "Marquee", macro: "Infinite scroll", note: "Auto-scrolling wordmark loop with mask-faded edges. Pauses on hover, respects reduced-motion.", Component: LogoCloudMarquee },
    { id: "sectioned", label: "Sectioned", macro: "Grouped by relation", note: "Logos grouped by relationship (Partners, Featured in) — honest labels, not invented tiers.", Component: LogoCloudSectioned },
    { id: "grid", label: "Grid", macro: "4×3 contact sheet", note: "Twelve marks in a hairline-ruled grid. Reads as a contact sheet, not a trust strip.", Component: LogoCloudGrid },
    { id: "pill-chips", label: "Pill chips", macro: "Rounded chip row", note: "Each wordmark in its own rounded chip. Denser than a strip; works at high partner counts.", Component: LogoCloudPillChips },
    { id: "credits", label: "Credits list", macro: "Vertical credit roll", note: "Partner roster as a vertical list with roles. Reads like film end-credits, not a logo wall.", Component: LogoCloudCredits },
  ],
  faq: [
    { id: "accordion", label: "Accordion", macro: "Native <details>", note: "Native HTML, single-open behaviour. Affordance is a typographic + / —, not a chevron.", Component: FaqAccordion },
    { id: "two-column", label: "Two-column", macro: "Q-left, A-right", note: "Every Q&A on display. Reads as a magazine interview, not a help-desk index.", Component: FaqTwoColumn },
    { id: "numbered", label: "Numbered", macro: "Ordered manifesto FAQ", note: "Asked, briefly answered. Numbered prefix in mono — reads as a list of arguments.", Component: FaqNumbered },
    { id: "search-led", label: "Search-led", macro: "Filter input + open list", note: "Search beats accordion when the FAQ runs long. Filtered, empty, and focus states all handled.", Component: FaqSearchLed },
    { id: "category-tabs", label: "Category tabs", macro: "Sliced by audience", note: "Questions sliced by audience (Designers, Engineers, Curators). Useful when the FAQ serves multiple roles.", Component: FaqCategoryTabs },
    { id: "compact", label: "Compact", macro: "Q-only with inline reveal", note: "Q-only by default; click expands A inline. Dense scanning for short answers.", Component: FaqCompact },
    { id: "with-cta", label: "FAQ + CTA", macro: "Closing conversion", note: "Three Q&A rows followed by a quiet conversion strip. Converts readers who got most of the way through.", Component: FaqWithCta },
  ],
  stat: [
    { id: "row", label: "Stat row", macro: "4-stat row", note: "Four real catalogue numbers, tabular-nums. Hallmark forbids invented stats — these are real.", Component: StatRow },
    { id: "single-hero", label: "Single hero", macro: "One giant number", note: "One number, set as large as the page allows. For when the strongest claim is countable and singular.", Component: StatSingleHero },
    { id: "bar-chart", label: "Bar chart", macro: "Horizontal bars", note: "Numbers shown as relative magnitudes, not isolated figures. Pure CSS, no chart library.", Component: StatBarChart },
    { id: "before-after", label: "Before / after", macro: "Two stats + arrow", note: "Shows movement, not just magnitude. Real numbers from the project — banner-killer impact.", Component: StatBeforeAfter },
    { id: "annotated", label: "Annotated", macro: "Stats + footnotes", note: "Each figure carries a superscript footnote naming its source. Invites \"according to what?\"", Component: StatAnnotated },
    { id: "grid", label: "Stat grid", macro: "6-stat grid", note: "Three columns of two stats each. Denser than the row; carries editorial captions.", Component: StatGrid },
  ],
};

export function getReferences(type: ComponentType): Reference[] {
  return REFERENCE[type] ?? [];
}
