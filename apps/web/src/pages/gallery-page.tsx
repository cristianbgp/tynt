import { useMemo, useState } from "react";
import {
  ChevronDown,
  Code,
  ExternalLink,
  Github,
  Play,
  Search,
  Shuffle,
  SortVertical,
} from "pixelarticons/react";
import { Link, useNavigate } from "react-router";
import { CartridgePreview } from "@/components/cartridge-preview";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { listPublicCartridges } from "@/cartridges/public-cartridges";
import { formatPublicationDate } from "@/lib/publication-date";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GalleryPageProps {
  soundEnabled?: boolean;
  onSoundToggle?(): void;
}
const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;
const PROJECT_REPOSITORY = "https://github.com/cristianbgp/tynt";
const GALLERY_CARTRIDGES = [...listPublicCartridges()].sort(
  (left, right) =>
    right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug),
);
type SortOrder = "newest" | "title" | "author";
const SORT_OPTIONS: readonly { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
];
const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest",
  title: "Title",
  author: "Author",
};

export function GalleryPage({ soundEnabled = true, onSoundToggle = () => {} }: GalleryPageProps) {
  const navigate = useNavigate();
  const cartridges = GALLERY_CARTRIDGES;
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const tags = useMemo(
    () => [...new Set(cartridges.flatMap((cartridge) => [...cartridge.tags]))].sort(),
    [cartridges],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = cartridges.filter((cartridge) => {
      if (tag && !cartridge.tags.includes(tag)) return false;
      if (!needle) return true;
      return [
        cartridge.slug,
        cartridge.title,
        cartridge.author,
        cartridge.description,
        cartridge.controls,
        ...cartridge.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return matches.sort((left, right) => {
      if (sortOrder === "title") return left.title.localeCompare(right.title);
      if (sortOrder === "author") {
        return left.author.localeCompare(right.author) || left.title.localeCompare(right.title);
      }
      return (
        right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug)
      );
    });
  }, [cartridges, query, sortOrder, tag]);

  const playRandom = () => {
    if (filtered.length === 0) return;
    const cartridge = filtered[Math.floor(Math.random() * filtered.length)];
    navigate(`/play/public/${cartridge.slug}`);
  };

  return (
    <div className="gallery-shell grid h-full w-full grid-rows-[41px_minmax(0,1fr)_25px] bg-background max-[560px]:h-dvh max-[560px]:grid-rows-[41px_minmax(0,1fr)_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader active="gallery" />
      <main className="gallery-main overflow-auto px-[clamp(18px,5vw,72px)] pt-[42px] pb-[72px] max-[560px]:px-[14px] max-[560px]:pt-[28px] max-[560px]:pb-[28px]">
        <header className="gallery-heading mx-auto mb-[32px] grid max-w-[1180px] grid-cols-[minmax(0,1fr)_minmax(260px,420px)] items-end gap-[32px] border-b border-foreground pb-[24px] max-[900px]:grid-cols-1 max-[560px]:gap-[18px]">
          <div className="grid gap-[14px]">
            <h1 className="m-0 text-[clamp(30px,5vw,58px)] leading-[0.95] font-[580] tracking-[-0.065em]">
              Cartridge gallery
            </h1>
            <p className="m-0 max-w-[52ch] leading-[1.55] text-[#555555]">
              Play public games, inspect their source, and remix them into your local library.
            </p>
          </div>
          <a
            className="gallery-submit inline-flex min-h-[42px] items-center justify-center gap-[8px] justify-self-end border border-foreground px-[14px] no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background max-[900px]:justify-self-start"
            href={`${PROJECT_REPOSITORY}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
            {...soundLinkProps}
          >
            <Github width={20} height={20} aria-hidden="true" />
            Submit a cartridge
          </a>
        </header>
        <section
          className="gallery-filters mx-auto mb-[20px] grid max-w-[1180px] gap-[10px]"
          aria-label="Filter public cartridges"
        >
          <div className="flex items-stretch justify-between gap-[10px] max-[700px]:flex-col">
            <label className="library-search-wrap flex w-[min(360px,100%)] items-center border border-border max-[700px]:w-full">
              <Search className="ml-[10px] flex-none" width={20} height={20} aria-hidden="true" />
              <span className="sr-only">Search cartridges</span>
              <input
                className="library-search w-full border-0 bg-background px-[12px] py-[10px] font-[inherit] text-foreground outline-none focus:border-foreground focus:shadow-[inset_0_0_0_1px_var(--foreground)]"
                type="search"
                aria-label="Search cartridges"
                placeholder="Search cartridges"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="flex min-w-0 items-stretch max-[700px]:w-full">
              <span className="flex items-center border border-r-0 border-border px-[10px] text-[10px] whitespace-nowrap text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "game" : "games"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="min-w-[152px] justify-between border border-r-0 border-border px-[12px] max-[700px]:flex-1"
                    aria-label={`Sort: ${SORT_LABELS[sortOrder]}`}
                  >
                    <SortVertical width={20} height={20} aria-hidden="true" />
                    <span>{SORT_LABELS[sortOrder]}</span>
                    <ChevronDown width={18} height={18} aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      className="data-[active=true]:bg-foreground data-[active=true]:text-background"
                      key={option.value}
                      data-active={sortOrder === option.value || undefined}
                      onSelect={() => setSortOrder(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="border border-border px-[12px] max-[700px]:flex-1"
                disabled={filtered.length === 0}
                aria-label="Random game"
                onClick={playRandom}
              >
                <Shuffle width={20} height={20} aria-hidden="true" />
                <span>Random</span>
              </Button>
            </div>
          </div>
          <div
            className="gallery-tags flex flex-wrap justify-end gap-[6px] max-[700px]:[scrollbar-width:thin] max-[700px]:flex-nowrap max-[700px]:justify-start max-[700px]:overflow-x-auto max-[700px]:p-[3px]"
            aria-label="Tags"
          >
            {tags.map((value) => (
              <button
                className="cursor-pointer border border-border bg-transparent px-[7px] py-[5px] font-[inherit] text-[9px] text-muted-foreground uppercase hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-[#555555] max-[700px]:min-h-[40px] max-[700px]:flex-none"
                key={value}
                type="button"
                aria-pressed={tag === value}
                data-cuelume-hover="tick"
                data-cuelume-toggle=""
                onClick={() => setTag((current) => (current === value ? null : value))}
              >
                {value}
              </button>
            ))}
          </div>
        </section>
        {filtered.length === 0 ? (
          <p className="gallery-no-results mx-auto my-[60px] max-w-[1180px] text-center text-muted-foreground">
            No public cartridges match “{query || tag}”.
          </p>
        ) : null}
        <section
          className="cartridge-grid mx-auto grid max-w-[1180px] grid-cols-2 border-t border-l border-border max-[900px]:grid-cols-1"
          aria-label="Public cartridges"
        >
          {filtered.map((cartridge, index) => (
            <article
              className="cartridge-card grid min-w-0 grid-cols-[minmax(160px,2fr)_minmax(180px,3fr)] border-r border-b border-border data-[featured=true]:col-span-full data-[featured=true]:grid-cols-[minmax(260px,3fr)_minmax(260px,2fr)] max-[900px]:grid-cols-1 max-[900px]:data-[featured=true]:col-auto max-[900px]:data-[featured=true]:grid-cols-1"
              data-featured={(index === 0 && !query && !tag && sortOrder === "newest") || undefined}
              key={cartridge.slug}
            >
              <Link
                className="cartridge-artwork grid min-h-[230px] place-items-center bg-muted p-[28px] no-underline hover:bg-[#e5e5e5] focus-visible:bg-[#e5e5e5] max-[560px]:min-h-[172px] max-[560px]:p-[12px]"
                aria-label={`View ${cartridge.title} details`}
                to={`/cartridges/${cartridge.slug}`}
                {...soundLinkProps}
              >
                <CartridgePreview filename={cartridge.filename} src={cartridge.coverUrl} />
              </Link>
              <div className="cartridge-copy flex min-w-0 flex-col border-l border-border p-[22px] [overflow-wrap:anywhere] max-[900px]:border-t max-[900px]:border-l-0">
                <div className="cartridge-title-row flex items-baseline justify-between gap-[16px]">
                  <h2 className="m-0 text-[16px] font-semibold tracking-[-0.03em]">
                    <Link
                      className="border-b border-transparent no-underline hover:border-current focus-visible:border-current"
                      to={`/cartridges/${cartridge.slug}`}
                      {...soundLinkProps}
                    >
                      {cartridge.filename}
                    </Link>
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <span className="library-author mt-[6px] text-[10px] text-muted-foreground">
                  by {cartridge.author} ·{" "}
                  <time dateTime={cartridge.publishedAt}>
                    {formatPublicationDate(cartridge.publishedAt)}
                  </time>
                </span>
                <p className="my-[18px] max-w-[42ch] leading-normal text-[#555555]">
                  {cartridge.description}
                </p>
                <span className="cartridge-controls text-[10px] leading-normal text-muted-foreground">
                  {cartridge.controls}
                </span>
                <div className="cartridge-tags mt-[14px] flex flex-wrap gap-[5px]">
                  {cartridge.tags.map((value) => (
                    <button
                      className="cursor-pointer border border-border bg-transparent px-[7px] py-[5px] font-[inherit] text-[9px] text-muted-foreground uppercase hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background max-[700px]:min-h-10"
                      key={value}
                      type="button"
                      aria-label={`Filter by ${value} from ${cartridge.filename}`}
                      aria-pressed={tag === value}
                      data-cuelume-hover="tick"
                      data-cuelume-toggle=""
                      onClick={() => setTag((current) => (current === value ? null : value))}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="cartridge-actions mt-auto -mr-[22px] -mb-[22px] -ml-[22px] grid grid-cols-3 border-t border-border [&>a]:flex [&>a]:min-h-[40px] [&>a]:items-center [&>a]:justify-center [&>a]:gap-[6px] [&>a]:border-r [&>a]:border-border [&>a]:px-[8px] [&>a]:no-underline [&>a:focus-visible]:bg-foreground [&>a:focus-visible]:text-background [&>a:hover]:bg-foreground [&>a:hover]:text-background [&>a:last-child]:border-r-0">
                  <Link
                    aria-label={`Play ${cartridge.filename}`}
                    to={`/play/public/${cartridge.slug}`}
                    {...soundLinkProps}
                  >
                    <Play width={18} height={18} aria-hidden="true" />
                    Play
                  </Link>
                  <Link
                    aria-label={`Open ${cartridge.filename} in editor`}
                    to={`/?cartridge=${cartridge.slug}`}
                    {...soundLinkProps}
                  >
                    <Code width={18} height={18} aria-hidden="true" />
                    Editor
                  </Link>
                  <a
                    aria-label={`View ${cartridge.filename} source`}
                    href={
                      cartridge.repository ??
                      `${PROJECT_REPOSITORY}/tree/main/cartridges/${cartridge.slug}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    {...soundLinkProps}
                  >
                    <ExternalLink width={18} height={18} aria-hidden="true" />
                    Source
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter
        summary={`${filtered.length} of ${cartridges.length} public cartridges`}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
      />
    </div>
  );
}
