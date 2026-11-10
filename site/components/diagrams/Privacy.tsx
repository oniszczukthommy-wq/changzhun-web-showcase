"use client";
import { Flow, Frame } from "@/components/explain/Frame";
import { useClock } from "@/components/explain/motion";

export const PRIVACY_STEPS = [
  "Kept on your Mac: what OnKey learned, and your takes",
  "Never saved or sent: the music's audio",
  "Sent out: lookups by name, for lyrics and covers",
  "To name a new song: a signature to Shazam",
];

const KEPT = ["Each song's notes and bars", "Its fingerprint and signature", "The lyrics and their timing", "Takes: your mic, scores, lyrics"];

/** A box outside the Mac: what it is, and what's sent to it (one line each). */
function Service({ y, h, title, lines, colour, on, dashed }: {
  y: number; h: number; title: string; lines: string[]; colour: string; on: boolean; dashed?: boolean;
}) {
  return (
    <g className="hl" opacity={on ? 1 : 0.35}>
      <rect x="318" y={y} width="148" height={h} rx="12" fill="var(--panel)" stroke={colour} strokeDasharray={dashed ? "5 3" : undefined} />
      <text x="392" y={y + 20} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--fg)">{title}</text>
      {lines.map((l, i) => (
        <text key={l} x="392" y={y + 37 + i * 15} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{l}</text>
      ))}
    </g>
  );
}

/** What stays on the Mac, what's never kept, and the lookups that leave it. */
export function Privacy({ step = 3, all = false }: { step?: number; all?: boolean }) {
  const t = useClock("privacy", 3);
  const on = (i: number) => all || i === step;
  return (
    <Frame label="What OnKey keeps and sends" caption={all ? "OnKey never saves the music it listens to" : PRIVACY_STEPS[step]}>
      <rect x="20" y="28" width="250" height="236" rx="16" fill="var(--panel)" stroke="var(--line)" />
      <text x="36" y="50" fontSize="12" fontWeight="600" fill="var(--fg)">Your Mac</text>
      <g className="hl" opacity={on(0) ? 1 : 0.35}>
        {KEPT.map((s, i) => (
          <g key={s} transform={`translate(32 ${66 + i * 30})`}>
            <rect width="226" height="24" rx="7" fill="var(--bg-raised)" stroke={i === 3 ? "var(--you)" : "var(--singer)"} strokeOpacity="0.7" />
            <text x="9" y="16" fontSize="11.5" fill="var(--fg-soft)">{s}</text>
          </g>
        ))}
      </g>
      <g className="hl" opacity={on(1) ? 1 : 0.35} transform="translate(32 196)">
        <rect width="226" height="44" rx="8" fill="none" stroke="var(--off)" strokeDasharray="4 3" />
        <text x="9" y="18" fontSize="11.5" fill="var(--fg-soft)">The music's audio: analysed as</text>
        <text x="9" y="34" fontSize="11.5" fill="var(--fg-soft)">it plays, never saved or sent</text>
      </g>
      <Flow d="M270 61 H318" colour="var(--singer)" t={t} on={on(2)} />
      <Flow d="M270 128 H318" colour="var(--singer)" t={t} on={on(2)} />
      <Flow d="M270 208 H318" colour="var(--music)" t={t} on={on(3)} />
      <Service y={30} h={62} title="LRCLIB" lines={["artist, title, album,", "length: for lyrics"]} colour="var(--singer)" on={on(2)} />
      <Service y={102} h={52} title="iTunes Search" lines={["artist, title: cover"]} colour="var(--singer)" on={on(2)} />
      <Service y={166} h={84} title="Shazam" lines={["a signature of the", "music, never the mic;", "can be turned off"]} colour="var(--music)" on={on(3)} dashed />
    </Frame>
  );
}
