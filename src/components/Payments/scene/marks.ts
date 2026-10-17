
import { PAYMENT_LOOKS } from "@/components/Payments/scene/looks";
import { PaymentMethodId } from "@/config/payments";
import type { MarkShape } from "@/packages/graphics/checkout";

// Every way to pay's mark as path data, so the buttons (as SVG) and the checkout (on canvas) draw the same one: the
// free Font Awesome brand icon in the mark's colour, or, where the free set has none, one drawn here in its own
// colours on a 24 unit grid (Mastercard's on a 40 by 24 one).

const circle = (cx: number, cy: number, r: number) => `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;

const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 ${-rx * 2},0Z`;

const DRAWN: Partial<Record<PaymentMethodId, MarkShape>> = {
  // Two circles and the orange where they overlap: the lens between circles of radius 10 twelve apart.
  mastercard: {
    width: 40,
    height: 24,
    parts: [
      { d: circle(14, 12, 10), fill: "#eb001b" },
      { d: circle(26, 12, 10), fill: "#f79e1b" },
      { d: "M20 4A10 10 0 0 1 20 20A10 10 0 0 1 20 4Z", fill: "#ff5f00" },
    ],
  },
  // Three slanted bars, green to purple.
  solana: {
    width: 24,
    height: 24,
    parts: [
      { d: "M6.5 4.5H22L18 8.5H2.5Z", fill: "#19fb9b" },
      { d: "M2.5 10H18L22 14H6.5Z", fill: "#7d9cf0" },
      { d: "M6.5 15.5H22L18 19.5H2.5Z", fill: "#9945ff" },
    ],
  },
  // A navy hexagon rimmed in blue, with the white and blue strokes of its A.
  arbitrum: {
    width: 24,
    height: 24,
    parts: [
      { d: "M12 1.5L21.5 7V17L12 22.5L2.5 17V7Z", fill: "#213147", stroke: "#12aaff", strokeWidth: 1.2 },
      { d: "M7.5 17L11 8.5H13L9.5 17Z", fill: "#ffffff" },
      { d: "M11.8 13.2L13 10.3L16.5 17H14.1Z", fill: "#12aaff" },
    ],
  },
  // Two linked rhombuses, Polygon's purple chain.
  polygon: {
    width: 24,
    height: 24,
    parts: [
      { d: "M8 6.5L12.5 9V14L8 16.5L3.5 14V9Z", stroke: "#8247e5", strokeWidth: 2.2 },
      { d: "M16 7.5L20.5 10V15L16 17.5L11.5 15V10Z", stroke: "#8247e5", strokeWidth: 2.2 },
    ],
  },
  // A diamond with four smaller ones round it, in BNB's yellow.
  bnb: {
    width: 24,
    height: 24,
    parts: [
      { d: "M12 8.6L15.4 12L12 15.4L8.6 12Z", fill: "#f3ba2f" },
      { d: "M12 2L15.2 5.2L13.6 6.8L12 5.2L10.4 6.8L8.8 5.2Z", fill: "#f3ba2f" },
      { d: "M12 22L8.8 18.8L10.4 17.2L12 18.8L13.6 17.2L15.2 18.8Z", fill: "#f3ba2f" },
      { d: "M2 12L4.2 9.8L6.4 12L4.2 14.2Z", fill: "#f3ba2f" },
      { d: "M22 12L19.8 14.2L17.6 12L19.8 9.8Z", fill: "#f3ba2f" },
    ],
  },
  // A blue coin with its dollar sign between two arcs.
  usdc: {
    width: 24,
    height: 24,
    parts: [
      { d: circle(12, 12, 11), fill: "#2775ca" },
      { d: "M8.2 5.8A7.3 7.3 0 0 0 8.2 18.2M15.8 5.8A7.3 7.3 0 0 1 15.8 18.2", stroke: "#ffffff", strokeWidth: 1.3 },
      {
        d: "M14.6 9.4C14.2 8.4 13.2 7.8 12 7.8C10.5 7.8 9.4 8.6 9.4 9.8C9.4 12.6 14.8 11.4 14.8 14.2C14.8 15.5 13.6 16.2 12 16.2" +
          "C10.6 16.2 9.6 15.6 9.2 14.5M12 6.4V17.6",
        stroke: "#ffffff",
        strokeWidth: 1.4,
      },
    ],
  },
  // A green coin with Tether's T and the ring across its stem.
  usdt: {
    width: 24,
    height: 24,
    parts: [
      { d: circle(12, 12, 11), fill: "#26a17b" },
      { d: "M6.5 6.5H17.5V9H13.3V18H10.7V9H6.5Z", fill: "#ffffff" },
      { d: ellipse(12, 11.4, 5.6, 1.5), stroke: "#ffffff", strokeWidth: 1.1 },
    ],
  },
};

// A method's mark; one from Font Awesome can be printed in another ink (on a card whose print it would vanish on).
export const markOf = (method: PaymentMethodId, ink?: string): MarkShape => {
  const drawn = DRAWN[method];
  const { icon, mark: own } = PAYMENT_LOOKS[method];
  const mark = ink ?? own;

  if (drawn) {
    return drawn;
  }

  if (!icon) {
    return { width: 24, height: 24, parts: [] };
  }

  const [width, height, , , path] = icon.icon;

  return { width, height, parts: (Array.isArray(path) ? path : [path]).map((d) => ({ d, fill: mark })) };
};
