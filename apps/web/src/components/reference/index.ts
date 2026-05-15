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

export type Reference = {
  id: string;
  /** Sentence-case display name, e.g. "Marquee" or "Stat-Led". */
  label: string;
  /** Hallmark macrostructure or archetype the example demonstrates. */
  macro: string;
  /** Why it earns its spot in the group — what structural axis it
   *  flips vs the others. Surfaces on the components page. */
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
      note: "The figure leads. The supporting copy sits to the right and pulls weight from the number. Use when the brief has a real number to lead with.",
      Component: HeroStatLed,
    },
    {
      id: "manifesto",
      label: "Manifesto",
      macro: "Manifesto",
      note: "Dark ground, single declaration, one phrase punched in accent. No CTA stack, no proof strip — the voice carries the brand.",
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
      note: "A hand-set table of contents at the foot. Reads like back-matter — numbered, mono, no underlines.",
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
};

export function getReferences(type: ComponentType): Reference[] {
  return REFERENCE[type] ?? [];
}
