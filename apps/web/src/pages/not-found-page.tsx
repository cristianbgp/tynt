import { Link } from "react-router";
import { TyntMark } from "@/components/brand";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <span className="state-mark"><TyntMark /></span>
      <p>404</p>
      <h1>Page not found</h1>
      <Link to="/" data-cuelume-hover="tick" data-cuelume-press="" data-cuelume-release="">Open editor</Link>
    </main>
  );
}
