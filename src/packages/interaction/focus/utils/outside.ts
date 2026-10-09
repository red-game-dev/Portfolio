import { PressRoot } from "../domain/types";
import { isInside } from "./targets";

// Calls `onOutside` for every press that starts outside what `inside` returns (read at the moment, so a part
// rendered later still counts), until the returned stop is called: for closing a menu or a popover when the reader
// presses anywhere else. A press starts at pointerdown, so a finger, a pen and a mouse all count.
export const listenOutside = (root: PressRoot, inside: () => Node | null, onOutside: () => void): (() => void) => {
  const onPress = (event: Event) => {
    if (!isInside(inside(), event.target)) {
      onOutside();
    }
  };

  root.addEventListener("pointerdown", onPress);

  return () => root.removeEventListener("pointerdown", onPress);
};
