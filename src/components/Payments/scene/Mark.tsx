import { FC } from "react";

import { markOf } from "@/components/Payments/scene/marks";
import { PaymentMethodId } from "@/config/payments";

// A way to pay's mark at a given height in pixels, drawn from the same path data the checkout paints on canvas.
export const Mark: FC<{ method: PaymentMethodId; size: number }> = ({ method, size }) => {
  const { width, height, parts } = markOf(method);

  return (
    <svg width={(size * width) / height} height={size} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {parts.map(({ d, fill, stroke, strokeWidth }) => (
        <path key={d} d={d} fill={fill ?? "none"} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </svg>
  );
};
