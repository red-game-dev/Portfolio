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
  | "ethereum"
  | "solana"
  | "arbitrum"
  | "polygon"
  | "bnb"
  | "usdc"
  | "usdt";

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
  solana: "scan",
  arbitrum: "scan",
  polygon: "scan",
  bnb: "scan",
  usdc: "scan",
  usdt: "scan",
};

// The groups the terminal offers them in, each with its name in the content (payments.terminal.groups).
export type PaymentGroupId = "cards" | "wallets" | "qr" | "crypto";

export const PAYMENT_GROUPS: Record<PaymentGroupId, PaymentMethodId[]> = {
  cards: ["visa", "mastercard", "amex", "discover", "jcb", "diners"],
  wallets: ["applePay", "googlePay"],
  qr: ["paypal", "alipay", "wechat"],
  crypto: ["bitcoin", "ethereum", "solana", "arbitrum", "polygon", "bnb", "usdc", "usdt"],
};

export const PAYMENT_GROUP_ORDER: PaymentGroupId[] = ["cards", "wallets", "qr", "crypto"];

export const PAYMENT_METHODS: PaymentMethodId[] = PAYMENT_GROUP_ORDER.flatMap((group) => PAYMENT_GROUPS[group]);

// The app the cashier opens on the till for each way to pay, as a smart terminal runs several: the card app for
// cards and phone wallets, QR pay for the QR wallets, and the crypto app for every coin and chain.
export type PayApp = "card" | "qr" | "crypto";

export const PAY_APPS: PayApp[] = ["card", "qr", "crypto"];

export const payAppOf = (method: PaymentMethodId): PayApp => {
  if (PAYMENT_GROUPS.crypto.includes(method)) {
    return "crypto";
  }

  return PAYMENT_GROUPS.qr.includes(method) ? "qr" : "card";
};

// The order a drawing's tabs pay in, one per switch: every card network and wallet, a share of the QR and crypto
// methods between them, and no two in a row meeting the terminal the same way, even as it wraps round, so
// consecutive switches never look alike.
export const PAY_SEQUENCE: PaymentMethodId[] = [
  "visa", "mastercard", "alipay", "applePay", "amex", "solana", "jcb", "googlePay", "usdc", "discover", "wechat", "diners",
  "bitcoin", "mastercard", "arbitrum", "applePay", "paypal", "visa", "ethereum",
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
