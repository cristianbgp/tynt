import { notFound } from "next/navigation";
import { getDocument } from "@/lib/source";

interface RawDocumentProps {
  params: Promise<{ slug: string[] }>;
}

export async function GET(_request: Request, { params }: RawDocumentProps) {
  const segments = (await params).slug;
  const slug = segments.length === 1 && segments[0] === "index" ? undefined : segments;
  const page = getDocument(slug);
  if (!page) notFound();

  return new Response(await page.data.getText("raw"), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
