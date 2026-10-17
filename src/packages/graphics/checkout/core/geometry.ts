// Where everything stands in the scene, in its own units: a smart terminal on a stand on the counter, its screen,
// the keys and apps the screen offers, and the size of what the customer holds.

export const SCENE = { width: 300, height: 210 } as const;

export const BODY = { x: 114, y: 16, width: 72, height: 136, radius: 13 } as const;

export const SCREEN = { x: 120, y: 28, width: 60, height: 96, radius: 5 } as const;

export const COUNTER_TOP = 168;

export const STAND = { neck: { x: 141, width: 18 }, foot: { x: 150, y: 172, rx: 36, ry: 6 } } as const;

// The stripe reader runs down the terminal's right side.
export const STRIPE = { x: BODY.x + BODY.width, top: 50, bottom: 140 } as const;

// The terminal's front camera, in the top of its face beside the printer's mouth, which reads a face to pay by.
export const CAMERA = { x: BODY.x + BODY.width - 7, y: BODY.y + 5, radius: 1.7 } as const;

// The button on the screen the customer taps to pay with their face.
export const SMILE_BUTTON = { x: SCREEN.x + SCREEN.width / 2, y: SCREEN.y + 76, width: 40, height: 13 } as const;

// The keypad on the screen, three across and four down: 1 to 9, the separator, 0 and OK.
export const KEYPAD = { left: 123, top: 58, width: 16, height: 12, gapX: 3, gapY: 3 } as const;

export const OK_KEY = 11;

export const keyCentre = (index: number) => ({
  x: KEYPAD.left + KEYPAD.width / 2 + (index % 3) * (KEYPAD.width + KEYPAD.gapX),
  y: KEYPAD.top + KEYPAD.height / 2 + Math.floor(index / 3) * (KEYPAD.height + KEYPAD.gapY),
});

// The terminal's three apps across the middle of its screen: the card app, QR pay and the crypto app.
export const APP_TILE = { size: 16, y: 74 } as const;

export const appCentre = (index: number) => ({ x: KEYPAD.left + KEYPAD.width / 2 + index * (KEYPAD.width + KEYPAD.gapX), y: APP_TILE.y + APP_TILE.size / 2 });

export const CARD = { long: 60, short: 38, radius: 4 } as const;

// A phone the size of a real one (about 71 by 147 by 8 millimetres), at the hand's scale: a card is 60 for its 85.6.
export const PHONE = { width: 50, height: 103, radius: 7, depth: 5.5 } as const;

// The key a character of the amount is keyed on, or null for one the keypad has no key for (the currency).
export const keyFor = (character: string): number | null => {
  if (character >= "1" && character <= "9") {
    return Number(character) - 1;
  }

  if (character === "0") {
    return 10;
  }

  return character === "." || character === "," ? 9 : null;
};

// The keys the cashier presses to key an amount, in order, without the OK that confirms it.
export const keysFor = (amount: string): number[] => {
  const keys = Array.from(amount).map(keyFor);

  return keys.filter((key): key is number => key !== null);
};

// The amount as the screen shows it once `typed` of its keyable characters are in: anything before the first of
// them (the currency) always shows.
export const amountShown = (amount: string, typed: number): string => {
  let count = 0;
  let shown = "";

  for (const character of Array.from(amount)) {
    if (keyFor(character) !== null) {
      if (count === typed) {
        break;
      }

      count += 1;
    }

    shown += character;
  }

  return shown;
};

// The parts a 3D stage lines its actors up with: the terminal's body and screen, a card, a phone and the scene.
export const CHECKOUT_LAYOUT = { body: BODY, screen: SCREEN, card: CARD, phone: PHONE, scene: SCENE } as const;
