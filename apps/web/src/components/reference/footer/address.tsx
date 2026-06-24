/* Inspo · component: footer · genre: editorial · theme: Inspo-paper
 * archetype: Ft8 Address card · diversification: real-world contact info,
 *   no link map, no social row
 * states: default + hover
 * contrast: pass (46-50)
 */

/**
 * Address card - for studios and agencies whose footer is a business
 * card. Postal + email + phone, set in mono caption type. Reads like
 * the back of a printed brochure. No social icons (icons in footers
 * are an AI tell).
 */
export function FooterAddress() {
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-meta">Find us</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-fg)]">
            Office C12
            <br />
            45 Greene Street
            <br />
            New York, NY 10013
          </p>
        </div>
        <div>
          <p className="text-meta">Write</p>
          <p className="mt-4 text-sm leading-relaxed">
            <a href="mailto:hello@inspo.design" className="text-[var(--color-fg)] hover:text-[var(--color-link)]">
              hello@inspo.design
            </a>
            <br />
            <span className="text-[var(--color-fg-muted)]">
              Replies inside two days.
            </span>
          </p>
        </div>
        <div>
          <p className="text-meta">Hours</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-fg)]">
            Mon - Fri
            <br />
            <span className="text-[var(--color-fg-muted)]">10:00 - 18:00 ET</span>
          </p>
        </div>
        <div>
          <p className="text-meta">Calendar</p>
          <p className="mt-4 text-sm leading-relaxed">
            <a href="#" className="text-[var(--color-fg)] hover:text-[var(--color-link)]">
              Book 30 minutes ↗
            </a>
          </p>
        </div>
      </div>
      <p className="text-meta mt-12 border-t rule pt-6">
        © {new Date().getFullYear()} Inspo · all sites credited to their designers
      </p>
    </footer>
  );
}
