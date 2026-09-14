import { llms } from "fumadocs-core/source/llms";
import { source } from "@/lib/source";

export const llmDocs = llms(source, {
  renderPage: async (page) => {
    const content = await page.data.getText("raw");
    return `${content.trim()}\n\nSource: https://docs.tynt.dev${page.url}\n`;
  },
});
