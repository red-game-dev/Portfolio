import { CSSProperties } from "react";

// useJourneyNav writes each stop's progress on the header; a menu item reads its own as --nav-progress.
export const progressOf = (index: number) => ({ "--nav-progress": `var(--nav-progress-${index}, 0)` } as CSSProperties);
