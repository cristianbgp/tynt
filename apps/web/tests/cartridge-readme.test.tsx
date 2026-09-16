// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { CartridgeReadme } from "@/components/cartridge-readme";

test("renders cartridge Markdown as structured React content", () => {
  render(
    <CartridgeReadme
      source={
        '# Guide\n\nPress **A** and call `tone()`.\n\n- First\n- Second\n\n[Docs](https://docs.tynt.dev)\n\n```ts\ntext("hi", 0, 0, 3);\n```'
      }
    />,
  );

  expect(screen.getByRole("heading", { name: "Guide" })).toBeVisible();
  expect(screen.getByText("A").tagName).toBe("STRONG");
  expect(screen.getByText("tone()").tagName).toBe("CODE");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("rel", "noreferrer");
  expect(screen.getByText('text("hi", 0, 0, 3);')).toBeVisible();
});

test("does not execute README HTML or unsafe links", () => {
  render(
    <CartridgeReadme source={'<img src=x onerror="alert(1)">\n\n[unsafe](javascript:alert(1))'} />,
  );

  expect(document.querySelector("img")).not.toBeInTheDocument();
  expect(document.querySelector("script")).not.toBeInTheDocument();
  expect(screen.getByText(/<img src=x/)).toBeVisible();
  expect(screen.getByRole("link", { name: "unsafe" })).toHaveAttribute("href", "#");
});
