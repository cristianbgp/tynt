import { llmDocs } from "@/lib/llms";

export async function GET() {
  return new Response(await llmDocs.full(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
