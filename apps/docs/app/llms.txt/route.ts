import { llmDocs } from "@/lib/llms";

export async function GET() {
  return new Response(await llmDocs.index(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
