import { DocsNav } from "@/components/DocsNav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12 md:py-14">
      <aside className="md:sticky md:top-24 md:self-start">
        <DocsNav />
      </aside>
      <article className="prose docs-wide min-w-0">{children}</article>
    </div>
  );
}
