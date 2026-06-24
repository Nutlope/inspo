import { site } from "@/lib/site";

type DatelineProps = {
  label?: string;
  date?: string;
  issue?: string;
};

export function Dateline({
  label = site.issue.title,
  date = site.issue.date,
  issue = site.issue.number,
}: DatelineProps) {
  return (
    <p className="text-meta flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-[var(--color-fg)]">
        Issue {site.marker}
        {issue}
      </span>
      <span aria-hidden>-</span>
      <span>{date}</span>
      <span aria-hidden>-</span>
      <span>{label}</span>
    </p>
  );
}
