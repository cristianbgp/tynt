import { Code, ExternalLink, Play } from "pixelarticons/react";
import { Link, useParams } from "react-router";
import { CartridgePreview } from "@/components/cartridge-preview";
import { CartridgeReadme } from "@/components/cartridge-readme";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TyntMark } from "@/components/brand";
import { findPublicCartridge } from "@/cartridges/public-cartridges";
import { formatPublicationDate } from "@/lib/publication-date";

const PROJECT_REPOSITORY = "https://github.com/cristianbgp/tynt";
const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;
const actionClassName =
  "inline-flex min-h-[42px] items-center justify-center gap-[7px] border border-foreground px-[14px] no-underline transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background";

interface CartridgePageProps {
  soundEnabled: boolean;
  onSoundToggle(): void;
}

export function CartridgePage({ soundEnabled, onSoundToggle }: CartridgePageProps) {
  const { slug = "" } = useParams();
  const cartridge = findPublicCartridge(slug);
  if (!cartridge) {
    return (
      <div className="grid min-h-full grid-rows-[41px_minmax(0,1fr)]">
        <SiteHeader />
        <main className="grid place-content-center justify-items-start gap-[12px] px-[20px]">
          <span className="state-mark inline-grid size-[42px] place-items-center bg-foreground [&_.brand-mark]:size-[24px]">
            <TyntMark />
          </span>
          <span>404</span>
          <h1 className="m-0 text-[28px]">Cartridge not found</h1>
          <p className="m-0 text-muted-foreground">This public cartridge does not exist.</p>
          <Link
            className="border-b border-current px-[2px] pb-[2px] hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
            to="/gallery"
            {...soundLinkProps}
          >
            Open gallery
          </Link>
        </main>
      </div>
    );
  }

  const repository =
    cartridge.repository ?? `${PROJECT_REPOSITORY}/tree/main/cartridges/${cartridge.slug}`;
  return (
    <div className="grid h-full w-full grid-rows-[41px_minmax(0,1fr)_25px] bg-background max-[560px]:h-dvh max-[560px]:grid-rows-[41px_minmax(0,1fr)_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader />
      <main className="overflow-auto px-[clamp(18px,5vw,72px)] py-[clamp(28px,5vw,64px)] max-[560px]:px-[14px]">
        <article className="mx-auto grid max-w-[1180px] grid-cols-[minmax(280px,2fr)_minmax(320px,3fr)] border border-foreground max-[800px]:grid-cols-1">
          <div className="grid content-start gap-[22px] bg-muted p-[clamp(18px,4vw,42px)]">
            <CartridgePreview filename={cartridge.filename} src={cartridge.coverUrl} />
            <dl className="grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-[8px] border-t border-border pt-[16px] text-[11px] [&_dd]:m-0 [&_dt]:text-muted-foreground">
              <dt>Author</dt>
              <dd>{cartridge.author}</dd>
              <dt>Controls</dt>
              <dd>{cartridge.controls}</dd>
              <dt>License</dt>
              <dd>{cartridge.license}</dd>
              <dt>Published</dt>
              <dd>
                <time dateTime={cartridge.publishedAt}>
                  {formatPublicationDate(cartridge.publishedAt)}
                </time>
              </dd>
            </dl>
          </div>
          <div className="grid min-w-0 content-start border-l border-foreground max-[800px]:border-t max-[800px]:border-l-0">
            <header className="grid gap-[14px] border-b border-border p-[clamp(20px,4vw,42px)]">
              <span className="text-[11px] text-muted-foreground">{cartridge.filename}</span>
              <h1 className="m-0 text-[clamp(34px,6vw,68px)] leading-[0.95] font-[580] tracking-[-0.065em]">
                {cartridge.title}
              </h1>
              <p className="m-0 max-w-[58ch] leading-[1.6] text-[#555555]">
                {cartridge.description}
              </p>
              <div className="flex flex-wrap gap-[6px]">
                {cartridge.tags.map((tag) => (
                  <span
                    className="border border-border px-[7px] py-[5px] text-[9px] text-muted-foreground uppercase"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-[8px] grid grid-cols-3 gap-[8px] max-[560px]:grid-cols-1">
                <Link
                  className={actionClassName}
                  aria-label={`Play ${cartridge.title}`}
                  to={`/play/public/${cartridge.slug}`}
                  {...soundLinkProps}
                >
                  <Play width={18} height={18} aria-hidden="true" />
                  Play
                </Link>
                <Link
                  className={actionClassName}
                  aria-label={`Remix ${cartridge.title}`}
                  to={`/?cartridge=${cartridge.slug}`}
                  {...soundLinkProps}
                >
                  <Code width={18} height={18} aria-hidden="true" />
                  Remix
                </Link>
                <a
                  className={actionClassName}
                  aria-label={`View ${cartridge.title} on GitHub`}
                  href={repository}
                  target="_blank"
                  rel="noreferrer"
                  {...soundLinkProps}
                >
                  <ExternalLink width={18} height={18} aria-hidden="true" />
                  Source
                </a>
              </div>
            </header>
            <section className="grid gap-[18px] border-b border-border p-[clamp(20px,4vw,42px)]">
              <h2 className="m-0 text-[18px]">About this cartridge</h2>
              {cartridge.readme ? (
                <CartridgeReadme source={cartridge.readme} />
              ) : (
                <p className="m-0 text-[#555555]">{cartridge.description}</p>
              )}
            </section>
            <section className="grid min-w-0 gap-[18px] p-[clamp(20px,4vw,42px)]">
              <h2 className="m-0 text-[18px]">Source</h2>
              <pre className="m-0 max-h-[520px] overflow-auto border border-border bg-muted p-[16px] text-[11px] leading-[1.6]">
                <code>{cartridge.source}</code>
              </pre>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter
        summary={`${cartridge.filename} · ${cartridge.license}`}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
      />
    </div>
  );
}
