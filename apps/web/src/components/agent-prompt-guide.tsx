/**
 * Agent-prompt guide - a small block at the foot of the detail page
 * with a pre-formatted prompt that drops the captured site's design
 * system into a coding agent's context. Mirrors a snippet you'd
 * normally hand-paste into Cursor / Claude Code.
 *
 * Server component (no JS-side state). Uses CopyValue (client) for
 * the actual clipboard handoff.
 */

import { CopyValue } from "@/components/copy-value";

export function AgentPromptGuide({
  slug,
  title,
  palette,
  fonts,
  macrostructure,
}: {
  slug: string;
  title: string;
  palette: string[];
  fonts: string[];
  macrostructure?: string | null;
}) {
  // Build a small, ready-to-paste prompt. Keep it short - agents do
  // better with under 200 words of brief than with 2 pages of spec.
  const promptLines = [
    `Build a landing page in the visual style of ${title}.`,
    ``,
    `Reference design system (extracted from the live site):`,
    `- Palette: ${palette.slice(0, 5).join(", ")}`,
    fonts.length ? `- Typefaces: ${fonts.slice(0, 3).join(", ")}` : "",
    macrostructure ? `- Macrostructure: ${macrostructure}` : "",
    ``,
    `Use the dominant colour for surfaces, the accent sparingly,`,
    `and lean on type weight + scale rather than colour for hierarchy.`,
    ``,
    `Full DESIGN.md: https://inspo.dev/api/design/${slug}`,
  ].filter(Boolean);
  const prompt = promptLines.join("\n");

  return (
    <section className="border rule p-6 lg:p-8 bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))]">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-meta">For your coding agent</p>
          <p className="font-display text-2xl mt-1">Drop-in prompt</p>
        </div>
        <CopyValue
          value={prompt}
          label="Copy agent prompt"
          className="text-xs"
        />
      </div>
      <p className="text-meta mt-3 max-w-prose">
        Paste this into Claude Code, Cursor, or any chat-based agent.
        Pairs the captured tokens with a short brief so the model has
        both the style and the goal in one block.
      </p>
      <pre className="mt-5 border rule p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap bg-[var(--color-bg)]">
        <code>{prompt}</code>
      </pre>
    </section>
  );
}
