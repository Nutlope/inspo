import { site } from "@/lib/site";

export function Colophon() {
  return (
    <footer className="mt-32 border-t rule">
      <div className="mx-auto grid max-w-[120rem] grid-cols-1 gap-10 px-6 py-12 text-meta sm:grid-cols-4 sm:px-10 sm:py-16">
        <div className="space-y-2">
          <p className="text-[var(--color-fg)] not-italic">{site.name}</p>
          <p>An archive of websites,</p>
          <p>served to your agent.</p>
        </div>

        <div className="space-y-2">
          <p>Typefaces</p>
          {site.colophon.typefaces.map((t) => (
            <p key={t} className="text-[var(--color-fg)]">
              {t}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <p>Built on</p>
          {site.colophon.stack.map((t) => (
            <p key={t} className="text-[var(--color-fg)]">
              {t}
            </p>
          ))}
        </div>

        <div className="space-y-2 sm:text-right">
          <p>© {site.colophon.year}</p>
          <p>All sites credited to their authors.</p>
          <p>
            <a href="/dmca" className="hover:text-[var(--color-link)]">
              Takedowns
            </a>
            {" — "}
            <a href="/colophon" className="hover:text-[var(--color-link)]">
              Colophon
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
