/** The four colours every diagram uses, each with one meaning. */
const ROLES = [
  { c: "var(--music)", name: "The music", note: "what your music app plays" },
  { c: "var(--singer)", name: "The singer", note: "the original vocal, its notes and lyrics" },
  { c: "var(--you)", name: "You", note: "your voice, from the mic" },
  { c: "var(--score)", name: "Your score", note: "how close you are" },
];

export function Legend({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={`wide not-prose !mt-6 flex list-none flex-wrap gap-x-5 gap-y-2 !pl-0 text-[13px] ${compact ? "" : "rounded-xl border border-line bg-bg-raised px-4 py-3"}`} aria-label="Colours used in the diagrams">
      {ROLES.map((r) => (
        <li key={r.name} className="!mt-0 flex items-center gap-2 text-muted">
          <span className="inline-block h-2.5 w-5 rounded-full" style={{ background: r.c }} aria-hidden="true" />
          <span><strong className="font-medium text-fg">{r.name}</strong>{compact ? "" : <span className="hidden sm:inline">: {r.note}</span>}</span>
        </li>
      ))}
    </ul>
  );
}
