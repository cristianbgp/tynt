import { Link } from "react-router";

const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;

export function TyntMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 18 18"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="18" height="18" fill="#000" />
      <rect width="6" height="6" fill="#fff" />
      <rect x="6" width="6" height="6" fill="#aaa" />
      <rect x="12" width="6" height="6" fill="#555" />
      <rect x="6" y="6" width="6" height="6" fill="#fff" />
      <rect x="6" y="12" width="6" height="6" fill="#aaa" />
    </svg>
  );
}

export function BrandLink() {
  return (
    <Link className="brand" to="/" aria-label="tynt editor" {...soundLinkProps}>
      <TyntMark />
      <span className="brand-wordmark">tynt</span>
    </Link>
  );
}
