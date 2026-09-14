import { Link } from "react-router";
import { TyntMark } from "@/components/brand";

export function NotFoundPage() {
  return (
    <main className="not-found-page grid min-h-full place-content-center justify-items-start gap-[12px] [&_h1]:m-0 [&_p]:m-0">
      <span className="state-mark inline-grid size-[42px] place-items-center bg-foreground [&_.brand-mark]:size-[24px]"><TyntMark /></span>
      <p>404</p>
      <h1>Page not found</h1>
      <Link className="border-b border-current px-[2px] pb-[2px] hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background" to="/" data-cuelume-hover="tick" data-cuelume-press="" data-cuelume-release="">Open editor</Link>
    </main>
  );
}
