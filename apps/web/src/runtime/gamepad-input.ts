import type { InputName } from "@tynt/core";

interface StandardGamepad {
  readonly connected: boolean;
  readonly mapping: string;
  readonly buttons: readonly { readonly pressed: boolean }[];
  readonly axes: readonly number[];
}

const DEAD_ZONE = 0.5;

/** Reads the first standard gamepad as tynt's six digital inputs. */
export function readGamepadInput(
  gamepads: readonly (StandardGamepad | null)[],
): ReadonlySet<InputName> | null {
  const gamepad = gamepads.find((item) => item?.connected && item.mapping === "standard");
  if (!gamepad) return null;

  const inputs = new Set<InputName>();
  if (gamepad.buttons[14]?.pressed || (gamepad.axes[0] ?? 0) < -DEAD_ZONE) inputs.add("left");
  if (gamepad.buttons[15]?.pressed || (gamepad.axes[0] ?? 0) > DEAD_ZONE) inputs.add("right");
  if (gamepad.buttons[12]?.pressed || (gamepad.axes[1] ?? 0) < -DEAD_ZONE) inputs.add("up");
  if (gamepad.buttons[13]?.pressed || (gamepad.axes[1] ?? 0) > DEAD_ZONE) inputs.add("down");
  if (gamepad.buttons[0]?.pressed) inputs.add("a");
  if (gamepad.buttons[1]?.pressed) inputs.add("b");
  return inputs;
}
