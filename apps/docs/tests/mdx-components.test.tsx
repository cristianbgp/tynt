import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock } from "@/components/mdx/code-block";
import { LinkCard } from "@/components/mdx/link-card";
import { Steps } from "@/components/mdx/steps";

describe("custom MDX components", () => {
  test("renders semantic callouts, steps, and link cards", () => {
    render(
      <>
        <Callout title="Keep it safe" variant="warning">Review the source.</Callout>
        <Steps><h3>Make a cartridge</h3><p>Start small.</p></Steps>
        <LinkCard href="https://tynt.dev" title="Open editor">Build in the browser.</LinkCard>
      </>,
    );

    expect(screen.getByRole("note", { name: "Keep it safe" })).toHaveAttribute("data-variant", "warning");
    expect(screen.getByRole("list", { name: "Steps" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Open editor/ })).toHaveAttribute("rel", "noreferrer");
  });

  test("copies code and announces the completed action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CodeBlock><code>{"clear(0);"}</code></CodeBlock>);

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("clear(0);"));
    expect(screen.getByRole("button", { name: "Code copied" })).toBeVisible();
  });
});
