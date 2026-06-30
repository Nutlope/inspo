import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Takedowns",
  description:
    "How to request removal of a screenshot from the Inspo archive. We honour valid DMCA / takedown notices.",
};

const STEPS = [
  "The exact URL on Inspo (the /screens/<slug> page) and the original site it was captured from.",
  "Your name and organisation, and how you relate to the work - the rights holder, or an agent authorised to act for them.",
  "A statement, made in good faith, that the use is not authorised by you, the rights holder, or the law.",
  "A statement, under penalty of perjury, that the information in your notice is accurate.",
  "Your physical or electronic signature.",
];

export default function DmcaPage() {
  const mailto = `mailto:${site.contact.dmca}?subject=${encodeURIComponent(
    "Inspo takedown request",
  )}`;

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-24 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Takedowns" />
        </div>

        <div className="lg:col-span-9 space-y-12">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            Request a{" "}
            <em className="not-italic text-[var(--color-link)]">takedown</em>.
          </h1>

          <div className="prose-style max-w-[64ch] space-y-6 text-lg leading-relaxed text-[var(--color-fg)]">
            <p>
              Inspo is an archive of publicly-published web pages, captured for
              study. Every screen credits the designer or studio when known and
              links back to its source. If you hold the rights to a site shown
              here and want it removed, we&rsquo;ll honour a valid request -
              usually within a few days.
            </p>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">What to include</p>
            <ol className="prose-style max-w-[64ch] list-none space-y-4 pl-0 text-[var(--color-fg)]">
              {STEPS.map((step, i) => (
                <li key={i}>
                  <span className="font-mono text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
                    {String(i + 1).padStart(2, "0")} ·
                  </span>{" "}
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">Send it</p>
            <p className="prose-style max-w-[64ch] text-[var(--color-fg)]">
              Email your notice to{" "}
              <a
                href={mailto}
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                {site.contact.dmca}
              </a>
              . We review every request by hand and reply once it&rsquo;s
              actioned.
            </p>
            <a
              href={mailto}
              className="inline-flex items-center border rule px-5 py-3 text-meta transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
            >
              Email a takedown request →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
