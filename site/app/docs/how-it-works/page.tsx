import type { Metadata } from "next";
import { Legend } from "@/components/explain/Legend";
import { HowSections } from "@/components/docs/HowSections";

export const metadata: Metadata = { title: "How OnKey works" };

export default function HowItWorks() {
  return (
    <>
      <h1>How OnKey works</h1>
      <p className="lede">
        Seven sections, from the big picture down to the exact numbers. All the analysis happens on your Mac.
      </p>
      <Legend />
      <HowSections />
    </>
  );
}
