import type { ReactNode } from "react";
import { DocsShell } from "@/components/docs/docs-shell";
import { getDocsNavigation } from "@/lib/navigation";

export default function DocsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <DocsShell navigation={getDocsNavigation()}>{children}</DocsShell>;
}
