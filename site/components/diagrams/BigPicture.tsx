"use client";
import { Flow, Frame, Node } from "@/components/explain/Frame";
import { useClock } from "@/components/explain/motion";

export const BIG_STEPS = [
  "Your music app plays a song",
  "OnKey hears it, on your Mac",
  "The first time, it learns the song",
  "You sing along with the notes",
  "You get a score and a report",
];

/** The whole journey: music app → OnKey hears → learns the song → you sing → score. `step` lights one stage. */
export function BigPicture({ step = 4, all = false }: { step?: number; all?: boolean }) {
  const t = useClock("big", 3);
  const on = (i: number) => all || i === step;
  const reached = (i: number) => all || i <= step;
  return (
    <Frame label="How OnKey works, end to end" caption={all ? "Music in, your score out. All on your Mac." : BIG_STEPS[step]}>
      <rect x="196" y="22" width="268" height="100" rx="16" fill="none" stroke="var(--line)" strokeDasharray="4 4" />
      <text x="452" y="38" textAnchor="end" fontSize="11" fill="var(--faint)">OnKey, on your Mac</text>
      <Flow d="M126 80 H186" colour="var(--music)" t={t} on={reached(1)} />
      <Flow d="M296 80 H340" colour="var(--music)" t={t} on={reached(2)} />
      <Flow d="M402 108 C402 150 380 176 352 196" colour="var(--singer)" t={t} on={reached(3)} />
      <Flow d="M278 222 H206" colour="var(--you)" t={t} on={reached(4)} />
      <Node x={70} y={80} w={110} colour="var(--music)" title="Music app" sub="Spotify, Music…" on={on(0)} />
      <Node x={241} y={80} w={98} colour="var(--music)" title="Hears it" sub="never saved" on={on(1)} />
      <Node x={402} y={80} w={112} colour="var(--singer)" title="Learns it" sub="notes and lyrics" on={on(2)} />
      <Node x={340} y={222} w={124} colour="var(--you)" title="You sing" sub="your mic" on={on(3)} />
      <Node x={140} y={222} w={124} colour="var(--score)" title="Your score" sub="and a report" on={on(4)} />
    </Frame>
  );
}
