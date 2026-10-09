import dynamic from "next/dynamic";

// The voyage, its dialog and its game load the first time the journey is continued. Mount it only while it is
// open: it opens itself on mount.
export const LazyVoyageDialog = dynamic(() => import("@/components/Finale/Voyage/VoyageDialog").then((module) => module.VoyageDialog), { ssr: false });
