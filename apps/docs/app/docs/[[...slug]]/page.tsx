import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/mdx-components";
import { getDocument, getDocumentNeighbors, source } from "@/lib/source";
import { Breadcrumbs } from "@/components/docs/breadcrumbs";
import { DocsPagination } from "@/components/docs/docs-pagination";
import { PageActions } from "@/components/docs/page-actions";
import { TableOfContents } from "@/components/docs/table-of-contents";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const page = getDocument((await params).slug);
  if (!page) return {};

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const page = getDocument((await params).slug);
  if (!page) notFound();

  const Body = page.data.body;
  const neighbors = getDocumentNeighbors(page.url);
  const rawUrl = page.url === "/docs" ? "/docs/index.md" : `${page.url}.md`;

  return (
    <>
      <main id="docs-content" className="min-w-0 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs title={page.data.title} url={page.url} />
          <header className="border-b border-border pb-7">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
              tynt documentation
            </p>
            {page.data.description ? (
              <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                {page.data.description}
              </p>
            ) : null}
            <PageActions rawUrl={rawUrl} sourcePath={`content/docs/${page.data.info.path}`} />
          </header>
          <div className="mt-8 border-y border-border py-5 xl:hidden">
            <TableOfContents items={page.data.toc} />
          </div>
          <article className="docs-article mt-10">
            <Body components={getMDXComponents()} />
          </article>
          <DocsPagination previous={neighbors.previous} next={neighbors.next} />
          <footer className="mt-12 border-t border-border pt-5 text-xs text-muted">
            Made by{" "}
            <a
              className="underline underline-offset-4 hover:bg-foreground hover:text-background"
              href="https://cristianbgp.com"
            >
              @cristianbgp
            </a>
            . tynt is MIT licensed.
          </footer>
        </div>
      </main>
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-border p-6 xl:block">
        <TableOfContents items={page.data.toc} />
      </aside>
    </>
  );
}
