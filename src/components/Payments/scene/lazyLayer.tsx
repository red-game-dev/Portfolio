import dynamic from "next/dynamic";

import type { PaymentLayerRender } from "@/components/SwitchStage";

// The payments switches load with the first payments drawing, never with the page or any other drawing.
const loadLayer = () => import("@/components/Payments/scene/PaymentLayer");

// The layer and the checkout it draws, fetched together so a drawing's first switch never waits.
export const preloadPaymentLayer = () => {
  Promise.all([loadLayer(), import("@/packages/graphics/checkout"), import("@/packages/graphics/rig")]).catch(() => undefined);
};

const PaymentLayer = dynamic(() => loadLayer().then((module) => module.PaymentLayer), { ssr: false });

export const renderPaymentLayer: PaymentLayerRender = (effect, count) => <PaymentLayer effect={effect} count={count} />;
