import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-16 text-center">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="border border-border px-4 py-3 hover:bg-foreground hover:text-background" href="/docs">Docs home</Link>
          <a className="border border-border px-4 py-3 hover:bg-foreground hover:text-background" href="https://tynt.dev">Open editor</a>
          <a className="border border-border px-4 py-3 hover:bg-foreground hover:text-background" href="https://tynt.dev/gallery">Gallery</a>
        </div>
      </div>
    </main>
  );
}
