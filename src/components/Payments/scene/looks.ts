import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faAlipay, faApplePay, faBitcoin, faCcAmex, faCcDinersClub, faCcDiscover, faCcJcb, faCcVisa, faEthereum, faGooglePay, faPaypal, faWeixin,
} from "@fortawesome/free-brands-svg-icons";

import { PaymentMethodId } from "@/config/payments";

// How each way to pay looks: a card in its network's own colours, or a phone whose screen carries the
// wallet's or the method's mark. Mastercard's mark is two circles, drawn in Mastercard.tsx; every other mark
// is the free Font Awesome brand icon.
export interface PaymentLook {
  // The face, top left to bottom right: a card's print, or a phone's screen.
  face: [string, string];
  mark: string;
  icon?: IconDefinition;
}

export const PAYMENT_LOOKS: Record<PaymentMethodId, PaymentLook> = {
  visa: { face: ["#1a1f71", "#2c3fa8"], mark: "#ffffff", icon: faCcVisa },
  mastercard: { face: ["#151515", "#3b3b3b"], mark: "#ffffff" },
  amex: { face: ["#0a8be0", "#0657a8"], mark: "#ffffff", icon: faCcAmex },
  discover: { face: ["#f7f7f7", "#d9d9d9"], mark: "#1d1d1b", icon: faCcDiscover },
  jcb: { face: ["#0e4c96", "#127a3d"], mark: "#ffffff", icon: faCcJcb },
  diners: { face: ["#0079be", "#00467a"], mark: "#ffffff", icon: faCcDinersClub },
  applePay: { face: ["#0a0a0a", "#1f1f21"], mark: "#ffffff", icon: faApplePay },
  googlePay: { face: ["#202124", "#3c4043"], mark: "#ffffff", icon: faGooglePay },
  paypal: { face: ["#ffffff", "#e6edf7"], mark: "#003087", icon: faPaypal },
  alipay: { face: ["#1677ff", "#0b5ad6"], mark: "#ffffff", icon: faAlipay },
  wechat: { face: ["#07c160", "#05a050"], mark: "#ffffff", icon: faWeixin },
  bitcoin: { face: ["#171717", "#2c2c2c"], mark: "#f7931a", icon: faBitcoin },
  ethereum: { face: ["#14152b", "#2d3060"], mark: "#8c9eff", icon: faEthereum },
};

// The chip's gold, and the paper of a receipt.
export const CHIP_GOLD: [string, string] = ["#e8c76a", "#b38b2d"];

export const RECEIPT_PAPER = "#f2f0ea";

// Mastercard's own colours: red, yellow, and the orange where they overlap.
export const MASTERCARD_COLOURS = { red: "#eb001b", yellow: "#f79e1b", overlap: "#ff5f00" } as const;
