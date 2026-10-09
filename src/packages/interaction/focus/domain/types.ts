// Where presses outside a part of the page are heard: the document in practice, a fake in tests.
export interface PressRoot {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}
