import { Link } from "react-router";

const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;

export function TyntMark() {
  return (
    <svg
      className="brand-mark block size-[18px] flex-none"
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
    <Link
      className="brand flex min-w-[94px] items-center justify-center gap-[8px] bg-foreground px-[14px] font-[650] tracking-[-0.04em] text-background no-underline transition-colors"
      to="/"
      aria-label="tynt editor"
      {...soundLinkProps}
    >
      <TyntMark />
      <span className="brand-wordmark leading-none">tynt</span>
    </Link>
  );
}
