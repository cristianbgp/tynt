import { BookOpen, Code, GalleryThumbnails, Image, Music } from "pixelarticons/react";
import { Link } from "react-router";
import { BrandLink } from "@/components/brand";
import { FooterActions } from "@/components/status-bar";

const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;

const routes = [
  { id: "editor", label: "Editor", to: "/editor", Icon: Code },
  { id: "gallery", label: "Gallery", to: "/gallery", Icon: GalleryThumbnails },
  { id: "library", label: "Library", to: "/library", Icon: BookOpen },
  { id: "sprites", label: "Sprites", to: "/sprites", Icon: Image },
  { id: "sounds", label: "Sounds", to: "/sounds", Icon: Music },
] as const;

export type SiteRoute = (typeof routes)[number]["id"];

export function SiteHeader({
  active,
  editorTo = "/editor",
}: {
  active?: SiteRoute;
  editorTo?: string;
}) {
  return (
    <header className="gallery-topbar flex border-b border-border">
      <BrandLink />
      <nav
        className="site-navigation ml-auto flex [&>a]:flex [&>a]:items-center [&>a]:gap-[7px] [&>a]:border-l [&>a]:border-border [&>a]:px-[16px] [&>a]:no-underline max-[700px]:[&>a]:px-[10px] max-[560px]:[&>a]:px-[8px] max-[360px]:[&>a]:px-[4px] [&>a:focus-visible]:bg-foreground [&>a:focus-visible]:text-background [&>a:hover]:bg-foreground [&>a:hover]:text-background max-[700px]:[&>a>span]:hidden [&>a[aria-current=page]]:bg-foreground [&>a[aria-current=page]]:text-background [&>a[aria-current=page]:hover]:bg-[#555555]"
        aria-label="Primary navigation"
      >
        {routes.map(({ id, label, to, Icon }) => (
          <Link
            key={id}
            to={id === "editor" ? editorTo : to}
            aria-label={label}
            aria-current={active === id ? "page" : undefined}
            {...soundLinkProps}
          >
            <Icon width={24} height={24} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter({
  summary,
  soundEnabled,
  onSoundToggle,
}: {
  summary: string;
  soundEnabled: boolean;
  onSoundToggle(): void;
}) {
  return (
    <footer className="gallery-footer flex items-center border-t border-border pl-[12px] text-[11px] text-[#555555] max-[560px]:min-h-[41px] max-[560px]:pb-[env(safe-area-inset-bottom)] max-[560px]:pl-0 [&>.footer-actions_.sound-toggle]:mr-0 [&>a]:flex [&>a]:items-center [&>a]:gap-[7px] [&>a]:self-stretch [&>a]:border-l [&>a]:border-border [&>a]:px-[16px] [&>a]:no-underline [&>a:first-of-type]:ml-auto [&>a:focus-visible]:bg-foreground [&>a:focus-visible]:text-background [&>a:hover]:bg-foreground [&>a:hover]:text-background max-[560px]:[&>span:first-child]:hidden">
      <span>{summary}</span>
      <Link to="/editor" {...soundLinkProps}>
        Open editor
      </Link>
      <FooterActions soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
    </footer>
  );
}
