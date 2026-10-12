import dynamic from "next/dynamic";

// The card for a pilot link from another device loads only when the page is opened with one.
export const LazyPilotArrival = dynamic(() => import("@/components/Finale/Voyage/PilotArrival").then((module) => module.PilotArrival), { ssr: false });
