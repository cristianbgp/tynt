// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CartridgeDetailsDialog } from "@/components/cartridge-details-dialog";

const sound = vi.hoisted(() => ({ play: vi.fn() }));
vi.mock("cuelume", () => sound);

test("edits validated cartridge metadata and displays the fixed format version", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(
    <CartridgeDetailsDialog
      open
      draft={{ title: "starter", source: "code" }}
      onOpenChange={() => {}}
      onSave={onSave}
    />,
  );

  expect(screen.getByText("tynt cartridge · format v1 · all fields required to export")).toBeVisible();
  await user.clear(screen.getByRole("textbox", { name: "Title" }));
  await user.type(screen.getByRole("textbox", { name: "Title" }), "orbit");
  await user.type(screen.getByRole("textbox", { name: "Author" }), "cristianbgp");
  await user.type(screen.getByRole("textbox", { name: "Description" }), "A small orbit game");
  await user.type(screen.getByRole("textbox", { name: "Controls" }), "Arrows move");
  await user.click(screen.getByRole("button", { name: "Save details" }));

  expect(onSave).toHaveBeenCalledWith({
    title: "orbit",
    source: "code",
    author: "cristianbgp",
    description: "A small orbit game",
    controls: "Arrows move",
  });
});

test("keeps invalid details open with a visible validation error", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(
    <CartridgeDetailsDialog
      open
      draft={{ title: "starter", source: "code" }}
      onOpenChange={() => {}}
      onSave={onSave}
    />,
  );

  await user.type(screen.getByRole("textbox", { name: "Author" }), "x".repeat(81));
  await user.click(screen.getByRole("button", { name: "Save details" }));

  expect(screen.getByRole("alert")).toHaveTextContent(/author/i);
  expect(onSave).not.toHaveBeenCalled();
  expect(sound.play).toHaveBeenCalledWith("error");
});
