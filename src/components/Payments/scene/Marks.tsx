import { FC } from "react";

// The marks the free Font Awesome set lacks, drawn here in each one's own colours on a 24 unit grid (Mastercard's
// two circles on a 40 by 24 one). Each is a plain picture, hidden from screen readers: the button or card it sits on
// carries the name.

export type DrawnMarkId = "mastercard" | "solana" | "arbitrum" | "polygon" | "bnb" | "usdc" | "usdt";

const Svg: FC<{ size: number; width?: number; children: JSX.Element | JSX.Element[] }> = ({ size, width = 24, children }) => (
  <svg width={(size * width) / 24} height={size} viewBox={`0 0 ${width} 24`} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

// Two circles and the orange where they overlap: the lens between circles of radius 10 twelve apart, whose
// edges meet at (20, 4) and (20, 20).
const Mastercard: FC<{ size: number }> = ({ size }) => (
  <Svg size={size} width={40}>
    <circle cx="14" cy="12" r="10" fill="#eb001b" />
    <circle cx="26" cy="12" r="10" fill="#f79e1b" />
    <path d="M20 4A10 10 0 0 1 20 20A10 10 0 0 1 20 4Z" fill="#ff5f00" />
  </Svg>
);

// Three slanted bars, green to purple.
const Solana: FC<{ size: number }> = ({ size }) => (
  <Svg size={size}>
    <path d="M6.5 4.5H22L18 8.5H2.5Z" fill="#19fb9b" />
    <path d="M2.5 10H18L22 14H6.5Z" fill="#7d9cf0" />
    <path d="M6.5 15.5H22L18 19.5H2.5Z" fill="#9945ff" />
  </Svg>
);

// A navy hexagon rimmed in blue, with the white and blue strokes of its A inside.
const Arbitrum: FC<{ size: number }> = ({ size }) => (
  <Svg size={size}>
    <path d="M12 1.5L21.5 7V17L12 22.5L2.5 17V7Z" fill="#213147" stroke="#12aaff" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M7.5 17L11 8.5H13L9.5 17Z" fill="#ffffff" />
    <path d="M11.8 13.2L13 10.3L16.5 17H14.1Z" fill="#12aaff" />
  </Svg>
);

// Two linked rhombuses, Polygon's purple chain.
const Polygon: FC<{ size: number }> = ({ size }) => (
  <Svg size={size}>
    <path d="M8 6.5L12.5 9V14L8 16.5L3.5 14V9Z" fill="none" stroke="#8247e5" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M16 7.5L20.5 10V15L16 17.5L11.5 15V10Z" fill="none" stroke="#8247e5" strokeWidth="2.2" strokeLinejoin="round" />
  </Svg>
);

// A diamond with four smaller ones round it, in BNB's yellow.
const Bnb: FC<{ size: number }> = ({ size }) => (
  <Svg size={size}>
    <path d="M12 8.6L15.4 12L12 15.4L8.6 12Z" fill="#f3ba2f" />
    <path d="M12 2L15.2 5.2L13.6 6.8L12 5.2L10.4 6.8L8.8 5.2Z" fill="#f3ba2f" />
    <path d="M12 22L8.8 18.8L10.4 17.2L12 18.8L13.6 17.2L15.2 18.8Z" fill="#f3ba2f" />
    <path d="M2 12L4.2 9.8L6.4 12L4.2 14.2Z" fill="#f3ba2f" />
    <path d="M22 12L19.8 14.2L17.6 12L19.8 9.8Z" fill="#f3ba2f" />
  </Svg>
);

// A blue coin with its dollar sign between two arcs.
const Usdc: FC<{ size: number }> = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="11" fill="#2775ca" />
    <path d="M8.2 5.8A7.3 7.3 0 0 0 8.2 18.2M15.8 5.8A7.3 7.3 0 0 1 15.8 18.2" fill="none" stroke="#ffffff" strokeWidth="1.3" />
    <text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif" fill="#ffffff">$</text>
  </Svg>
);

// A green coin with Tether's T and the ring across its stem.
const Usdt: FC<{ size: number }> = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="11" fill="#26a17b" />
    <path d="M6.5 6.5H17.5V9H13.3V18H10.7V9H6.5Z" fill="#ffffff" />
    <ellipse cx="12" cy="11.4" rx="5.6" ry="1.5" fill="none" stroke="#ffffff" strokeWidth="1.1" />
  </Svg>
);

const DRAWN: Record<DrawnMarkId, FC<{ size: number }>> = {
  mastercard: Mastercard,
  solana: Solana,
  arbitrum: Arbitrum,
  polygon: Polygon,
  bnb: Bnb,
  usdc: Usdc,
  usdt: Usdt,
};

export const DrawnMark: FC<{ id: DrawnMarkId; size: number }> = ({ id, size }) => {
  const Mark = DRAWN[id];

  return <Mark size={size} />;
};
