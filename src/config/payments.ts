// The ways to pay the payments section shows, each meeting the terminal the way it does at a real counter.
// Only the methods my own systems took are listed. Their names are content (payments.terminal.methods).

// How a way to pay meets the terminal: a chip card inserted, a card tapped, a card swiped through the
// stripe reader, a phone wallet held to it, or a QR code scanned.
export type PayGesture = "insert" | "tap" | "swipe" | "wallet" | "scan";

export type PaymentMethodId =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "jcb"
  | "diners"
  | "applePay"
  | "googlePay"
  | "paypal"
  | "alipay"
  | "wechat"
  | "bitcoin"
  | "ethereum";

export const PAY_GESTURES: Record<PaymentMethodId, PayGesture> = {
  visa: "insert",
  mastercard: "tap",
  amex: "swipe",
  discover: "tap",
  jcb: "insert",
  diners: "swipe",
  applePay: "wallet",
  googlePay: "wallet",
  paypal: "scan",
  alipay: "scan",
  wechat: "scan",
  bitcoin: "scan",
  ethereum: "scan",
};

// The order the terminal offers them in: the card networks, the phone wallets, then the QR methods.
export const PAYMENT_METHODS: PaymentMethodId[] = [
  "visa", "mastercard", "amex", "discover", "jcb", "diners", "applePay", "googlePay", "paypal", "alipay", "wechat", "bitcoin", "ethereum",
];

// The order a drawing's tabs pay in, one per switch: every method once, and no two in a row meeting the
// terminal the same way, even as it wraps round, so consecutive switches never look alike.
export const PAY_SEQUENCE: PaymentMethodId[] = [
  "visa", "mastercard", "alipay", "applePay", "amex", "wechat", "jcb", "googlePay", "paypal", "discover", "bitcoin", "diners", "ethereum",
];

// A card is held in the hand; a wallet or a QR code is on a phone.
export const isOnPhone = (method: PaymentMethodId): boolean => ["wallet", "scan"].includes(PAY_GESTURES[method]);

// The cards, for the POS drawing's own switch: a card tapped and a receipt printed, its network changing each time.
export const CARD_METHODS: PaymentMethodId[] = PAYMENT_METHODS.filter((method) => !isOnPhone(method));

// The method for the nth switch (counted from 1, as the switch counts them).
export const methodForSwitch = (sequence: PaymentMethodId[], count: number): PaymentMethodId =>
  sequence[(((count - 1) % sequence.length) + sequence.length) % sequence.length];

// The payments drawings a link opens by name, from the menu's Payments stop or shared: #payments-gateway
// scrolls to the drawings and opens the gateway.
export type PaymentDrawingKey = "pos" | "offline" | "gateway" | "cardPayment" | "payouts";

export const PAYMENT_DRAWING_ANCHORS: Record<PaymentDrawingKey, string> = {
  pos: "payments-pos",
  offline: "payments-offline",
  gateway: "payments-gateway",
  cardPayment: "payments-card",
  payouts: "payments-payouts",
};

export const PAYMENT_DRAWINGS = Object.keys(PAYMENT_DRAWING_ANCHORS) as PaymentDrawingKey[];
