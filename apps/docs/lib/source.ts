import { loader } from "fumadocs-core/source";
import { findNeighbour, flattenTree } from "fumadocs-core/page-tree";
import { defineDocs } from "fumadocs-mdx/macro";

const docs = defineDocs({
  dir: "content/docs",
});

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export type DocsPage = ReturnType<typeof source.getPages>[number];

export function getDocument(slug?: string[]): DocsPage | undefined {
  return source.getPage(slug);
}

export function getOrderedDocuments(): DocsPage[] {
  return flattenTree(source.pageTree.children)
    .map((node) => source.getPageByUrl(node.url))
    .filter((page): page is DocsPage => page !== undefined);
}

export function getDocumentNeighbors(url: string): {
  previous?: DocsPage;
  next?: DocsPage;
} {
  const neighbors = findNeighbour(source.pageTree, url);
  return {
    previous: neighbors.previous ? source.getPageByUrl(neighbors.previous.url) : undefined,
    next: neighbors.next ? source.getPageByUrl(neighbors.next.url) : undefined,
  };
}
