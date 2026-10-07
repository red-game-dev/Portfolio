import dynamic from "next/dynamic";

// A region's dialog, with its screens and blueprint, loads the first time a region is opened. Mount it only
// while a region is open: it opens itself on mount.
export const LazyRegionDialog = dynamic(() => import("@/components/Projects/RegionDialog").then((module) => module.RegionDialog), { ssr: false });
