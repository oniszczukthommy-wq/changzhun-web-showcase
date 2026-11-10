/**
 * Tiny animated pictures that sit next to key terms in the text, in the same colours as the big diagrams.
 * CSS-only, so they cost nothing; with reduced motion they hold still.
 */
type Kind = "separate" | "lane" | "wave" | "fingerprint" | "echo" | "score" | "mic" | "lock";

export function Glyph({ kind, label }: { kind: Kind; label?: string }) {
  return (
    <span className="glyph" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 28 16" width="28" height="16">{SHAPES[kind]}</svg>
    </span>
  );
}

const wave = (y: number, amp: number, phase = 0) =>
  Array.from({ length: 15 }, (_, i) => `${i ? "L" : "M"}${i * 2},${(y + amp * Math.sin(i * 1.3 + phase)).toFixed(1)}`).join(" ");

const SHAPES: Record<Kind, React.ReactNode> = {
  separate: (
    <g fill="none" strokeWidth="1.4" strokeLinecap="round">
      <path d={wave(8, 3)} stroke="var(--music)" className="g-fade" />
      <path d={wave(4, 2)} stroke="var(--singer)" className="g-up" />
      <path d={wave(12, 2, 1)} stroke="var(--music)" className="g-down" opacity="0.6" />
    </g>
  ),
  lane: (
    <g className="g-scroll">
      <rect x="2" y="9" width="7" height="3" rx="1.5" fill="var(--singer)" />
      <rect x="11" y="5" width="6" height="3" rx="1.5" fill="var(--singer)" />
      <rect x="19" y="7" width="8" height="3" rx="1.5" fill="var(--singer)" />
      <rect x="29" y="4" width="6" height="3" rx="1.5" fill="var(--singer)" />
    </g>
  ),
  wave: <path d={wave(8, 4)} fill="none" stroke="var(--music)" strokeWidth="1.4" className="g-scroll" />,
  fingerprint: (
    <g>
      {Array.from({ length: 6 }, (_, c) => Array.from({ length: 3 }, (_, r) => (
        <rect key={`${c}-${r}`} x={2 + c * 4} y={2 + r * 4.5} width="3" height="3.5" rx="0.6" fill="var(--music)" opacity={0.25 + ((c * 7 + r * 3) % 5) / 6} />
      )))}
      <rect x="9" y="1" width="9" height="14" rx="2" fill="none" stroke="var(--fg)" strokeWidth="1" className="g-slide" />
    </g>
  ),
  echo: (
    <g fill="none" strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 8 a4 4 0 0 1 0 0" />
      <path d="M6 4 q4 4 0 8" stroke="var(--music)" className="g-pulse" />
      <path d="M10 2 q6 6 0 12" stroke="var(--music)" className="g-pulse g-d1" />
      <path d="M18 8 h8" stroke="var(--you)" />
      <path d="M14 4 l12 8" stroke="var(--off)" strokeWidth="1.2" />
    </g>
  ),
  score: (
    <g>
      <rect x="2" y="7" width="24" height="3" rx="1.5" fill="var(--line)" />
      <rect x="2" y="7" width="17" height="3" rx="1.5" fill="var(--score)" className="g-grow" />
    </g>
  ),
  mic: (
    <g fill="none" stroke="var(--you)" strokeWidth="1.4" strokeLinecap="round">
      <rect x="4" y="2" width="5" height="8" rx="2.5" />
      <path d="M2 8 a4.5 4.5 0 0 0 9 0 M6.5 12.5 v2" />
      <path d={wave(8, 2.5)} transform="translate(12 0) scale(0.55 1)" className="g-scroll" />
    </g>
  ),
  lock: (
    <g fill="none" stroke="var(--you)" strokeWidth="1.4" strokeLinecap="round">
      <rect x="8" y="7" width="12" height="8" rx="2" />
      <path d="M11 7 V5 a3 3 0 0 1 6 0 V7" />
    </g>
  ),
};
