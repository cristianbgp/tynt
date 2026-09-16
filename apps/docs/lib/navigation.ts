import type { Node } from "fumadocs-core/page-tree";
import { source } from "@/lib/source";

export interface DocsNavigationItem {
  title: string;
  url?: string;
  children?: DocsNavigationItem[];
}

function titleForNode(node: Node): string {
  if (node.type === "page") return source.getPageByUrl(node.url)?.data.title ?? String(node.name);
  return typeof node.name === "string" ? node.name : "Documentation";
}

function transformNode(node: Node): DocsNavigationItem | undefined {
  if (node.type === "separator")
    return node.name ? { title: String(node.name), children: [] } : undefined;
  if (node.type === "page") return { title: titleForNode(node), url: node.url };

  const children = [node.index, ...node.children]
    .filter((child): child is Node => child !== undefined)
    .map(transformNode)
    .filter((child): child is DocsNavigationItem => child !== undefined);
  return { title: titleForNode(node), children };
}

export function getDocsNavigation(): DocsNavigationItem[] {
  return source.pageTree.children
    .map(transformNode)
    .filter((item): item is DocsNavigationItem => item !== undefined);
}
