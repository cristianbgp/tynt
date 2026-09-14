import type { ReactNode } from "react";

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="docs-steps my-7 border-l border-border pl-7" role="list" aria-label="Steps">
      {children}
    </div>
  );
}
