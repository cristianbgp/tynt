import { lazy, Suspense, useState } from "react";
import { Code, ExternalLink, Github, Play } from "pixelarticons/react";
import { Link } from "react-router";
import { CartridgePreview } from "@/components/cartridge-preview";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { listPublicCartridges } from "@/cartridges/public-cartridges";

const FeaturedGame = lazy(() =>
  import("@/components/featured-game").then(({ FeaturedGame }) => ({ default: FeaturedGame })),
);

const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;
const cartridges = listPublicCartridges();
const newest = [...cartridges].sort(
  (left, right) =>
    right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug),
);

interface HomePageProps {
  soundEnabled: boolean;
  onSoundToggle(): void;
}

export function HomePage({ soundEnabled, onSoundToggle }: HomePageProps) {
  const [featured] = useState(() => cartridges[Math.floor(Math.random() * cartridges.length)]!);
  const [playing, setPlaying] = useState(false);
  const recent = newest.filter((cartridge) => cartridge.slug !== featured.slug).slice(0, 3);

  return (
    <div className="grid h-full w-full grid-rows-[41px_minmax(0,1fr)_25px] bg-background max-[560px]:h-dvh max-[560px]:grid-rows-[41px_minmax(0,1fr)_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader />
      <main className="min-h-0 overflow-auto">
        <div className="mx-auto max-w-[1180px] px-[clamp(18px,5vw,72px)] max-[560px]:px-[14px]">
          <section
            className="grid min-h-[min(690px,calc(100dvh-66px))] grid-cols-[minmax(0,1fr)_minmax(320px,480px)] items-center gap-[clamp(32px,5vw,88px)] border-b border-border py-[clamp(32px,6vw,72px)] max-[800px]:min-h-0 max-[800px]:grid-cols-1 max-[800px]:gap-[36px] max-[560px]:py-[28px]"
            aria-labelledby="home-title"
          >
            <div className="min-w-0">
              <h1
                id="home-title"
                className="m-0 max-w-[14ch] text-[clamp(42px,6vw,72px)] leading-[0.98] font-semibold tracking-[-0.075em] max-[560px]:text-[clamp(38px,11vw,60px)]"
              >
                A tiny game console.
              </h1>
              <p className="mt-[24px] mb-[30px] max-w-[36ch] text-[clamp(13px,1.4vw,16px)] leading-[1.55] text-[#555555] max-[560px]:my-[18px]">
                Write TypeScript cartridges in your browser. Draw on a 160 × 144 screen in four
                shades, then play and share.
              </p>
              <div className="flex flex-wrap gap-[8px] max-[420px]:grid max-[420px]:grid-cols-2">
                <Link
                  className="inline-flex min-h-[44px] items-center justify-center gap-[9px] border border-foreground bg-foreground px-[16px] font-medium text-background no-underline hover:bg-[#555555] focus-visible:bg-[#555555]"
                  to="/gallery"
                  {...soundLinkProps}
                >
                  <Play width={18} height={18} aria-hidden="true" /> Play games
                </Link>
                <Link
                  className="inline-flex min-h-[44px] items-center justify-center gap-[9px] border border-foreground px-[16px] font-medium no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
                  to="/editor"
                  {...soundLinkProps}
                >
                  <Code width={18} height={18} aria-hidden="true" /> Open editor
                </Link>
              </div>
            </div>
            <div className="min-w-0 border border-foreground">
              <div className="flex min-h-[40px] items-center justify-between gap-[12px] border-b border-border px-[14px] text-[11px]">
                <span className="font-semibold">Featured: {featured.filename}</span>
                <span className="text-muted-foreground">by {featured.author}</span>
              </div>
              {playing ? (
                <Suspense
                  fallback={
                    <div className="grid min-h-[360px] place-items-center bg-muted" role="status">
                      Loading game…
                    </div>
                  }
                >
                  <FeaturedGame cartridge={featured} soundEnabled={soundEnabled} />
                </Suspense>
              ) : (
                <div className="relative grid min-h-[360px] place-items-center bg-muted p-[24px] max-[560px]:min-h-[280px] max-[560px]:p-[18px]">
                  <CartridgePreview filename={featured.filename} src={featured.coverUrl} />
                  <button
                    className="absolute bottom-[24px] left-1/2 inline-flex min-h-[44px] -translate-x-1/2 cursor-pointer items-center gap-[8px] border border-foreground bg-background px-[16px] hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background max-[560px]:bottom-[18px]"
                    type="button"
                    data-cuelume-hover="tick"
                    data-cuelume-press=""
                    data-cuelume-release=""
                    onClick={() => setPlaying(true)}
                  >
                    <Play width={18} height={18} aria-hidden="true" /> Play here
                  </button>
                </div>
              )}
              <Link
                className="flex min-h-[40px] items-center justify-between gap-[12px] border-t border-border px-[14px] no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
                to={`/cartridges/${featured.slug}`}
                {...soundLinkProps}
              >
                <span>About this game</span>
                <ExternalLink width={18} height={18} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="py-[clamp(40px,6vw,72px)]" aria-labelledby="recent-title">
            <div className="mb-[24px] flex items-end justify-between gap-[16px]">
              <h2
                id="recent-title"
                className="m-0 text-[clamp(24px,3vw,40px)] font-semibold tracking-[-0.06em]"
              >
                Recently published
              </h2>
              <Link
                className="border-b border-current pb-[2px] whitespace-nowrap no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
                to="/gallery"
                {...soundLinkProps}
              >
                All games
              </Link>
            </div>
            <div className="grid grid-cols-3 border-t border-l border-border max-[700px]:grid-cols-1">
              {recent.map((cartridge) => (
                <Link
                  className="group flex min-w-0 flex-col border-r border-b border-border no-underline hover:bg-muted focus-visible:bg-muted"
                  key={cartridge.slug}
                  to={`/cartridges/${cartridge.slug}`}
                  {...soundLinkProps}
                >
                  <div className="grid min-h-[190px] place-items-center bg-muted p-[20px] max-[700px]:min-h-[170px]">
                    <CartridgePreview filename={cartridge.filename} src={cartridge.coverUrl} />
                  </div>
                  <div className="flex min-h-[54px] items-center justify-between gap-[12px] border-t border-border px-[16px]">
                    <span className="min-w-0 truncate font-semibold">{cartridge.filename}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground group-hover:text-foreground">
                      by {cartridge.author}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-[32px] border-t border-border py-[clamp(40px,6vw,72px)] max-[700px]:grid-cols-1"
            aria-labelledby="create-title"
          >
            <div>
              <h2
                id="create-title"
                className="m-0 text-[clamp(24px,3vw,40px)] font-semibold tracking-[-0.06em]"
              >
                Make one of your own.
              </h2>
              <p className="max-w-[34ch] leading-[1.6] text-[#555555]">
                Build and test in your browser. Save drafts locally, then export a cartridge to
                publish it.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-[18px] max-[560px]:grid-cols-1">
              <div className="border-t border-foreground pt-[14px]">
                <h3 className="m-0 text-[15px]">Create</h3>
                <p className="leading-[1.6] text-[#555555]">
                  Write TypeScript and draw with the tynt API.
                </p>
              </div>
              <div className="border-t border-foreground pt-[14px]">
                <h3 className="m-0 text-[15px]">Play</h3>
                <p className="leading-[1.6] text-[#555555]">
                  Run it with keys or on-screen controls.
                </p>
              </div>
              <div className="border-t border-foreground pt-[14px]">
                <h3 className="m-0 text-[15px]">Share</h3>
                <p className="leading-[1.6] text-[#555555]">
                  Export your cartridge and submit it through GitHub.
                </p>
              </div>
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-[14px] border-t border-foreground py-[24px]">
            <p className="m-0">tynt is open source. The games are, too.</p>
            <a
              className="inline-flex min-h-[40px] items-center gap-[8px] border border-foreground px-[12px] no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
              href="https://github.com/cristianbgp/tynt/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              {...soundLinkProps}
            >
              <Github width={18} height={18} aria-hidden="true" /> Contribute on GitHub
            </a>
          </div>
        </div>
      </main>
      <SiteFooter
        summary="tiny browser game console"
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
      />
    </div>
  );
}
