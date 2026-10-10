import { KeyInput } from "@/packages/interaction/keys";

export interface KeyPress extends KeyInput {
  preventDefault: jest.Mock;
  stopPropagation: jest.Mock;
}

// A key press as the maps read it: no modifier unless one is given, and spies for what handling it does.
export const keyPress = (key: string, init: Partial<KeyInput> = {}): KeyPress => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  ...init,
});
