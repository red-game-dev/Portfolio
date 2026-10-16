import dynamic from "next/dynamic";

import type { PaymentLayerRender } from "@/components/SwitchStage";

// The payments switches load with the first payments drawing, never with the page or any other drawing.
const loadLayer = () => import("@/components/Payments/scene/PaymentLayer");

export const preloadPaymentLayer = () => {
  loadLayer().catch(() => undefined);
};

const PaymentLayer = dynamic(() => loadLayer().then((module) => module.PaymentLayer), { ssr: false });

export const renderPaymentLayer: PaymentLayerRender = (effect, count) => <PaymentLayer effect={effect} count={count} />;
