// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ErrorConsole } from "@/components/error-console";

describe("error console", () => {
  test("pairs an error message with an explicit visible label", () => {
    render(<ErrorConsole error="draw: player boom" />);

    expect(screen.getByRole("alert", { name: "Errors" })).toBeVisible();
    expect(screen.getByText("Error", { exact: true })).toBeVisible();
    expect(screen.getByText("draw: player boom", { exact: true })).toBeVisible();
  });
});
