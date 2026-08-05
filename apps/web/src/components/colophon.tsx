import { site } from "@/lib/site";

export function Colophon() {
  return (
    <footer className="mt-12 border-t rule">
      <div className="mx-auto grid max-w-[120rem] grid-cols-1 gap-10 px-6 py-10 text-meta sm:grid-cols-4 sm:px-10 sm:py-12">
        <div className="space-y-2">
          <p className="text-[var(--color-fg)] not-italic">{site.name}</p>
          <p>A thousand websites</p>
          <p>worth studying.</p>
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
            {" - "}
            <a href="/colophon" className="hover:text-[var(--color-link)]">
              Colophon
            </a>
          </p>
          <p className="pt-3 text-[var(--color-fg)]">
            Powered by{" "}
            <a
              href="https://www.together.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-link)]"
            >
              Together AI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
