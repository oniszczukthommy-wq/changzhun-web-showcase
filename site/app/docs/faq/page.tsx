import type { Metadata } from "next";
import { FIRST_QUESTIONS, FaqList, MORE_QUESTIONS } from "@/components/Faq";

export const metadata: Metadata = { title: "FAQ" };

export default function Faq() {
  return (
    <>
      <h1>FAQ</h1>
      <h2>Before you download</h2>
      <FaqList items={FIRST_QUESTIONS} />
      <h2>Using OnKey</h2>
      <FaqList items={MORE_QUESTIONS} />
    </>
  );
}
