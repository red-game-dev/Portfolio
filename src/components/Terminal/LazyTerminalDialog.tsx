import dynamic from "next/dynamic";

// The quest dialog is only needed once someone opens it, so its code loads then. Mount it only while there
// is a dialog to show: it opens itself on mount.
export const LazyTerminalDialog = dynamic(() => import("@/components/Terminal/TerminalDialog").then((module) => module.TerminalDialog), { ssr: false });
