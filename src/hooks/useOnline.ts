import { useSyncExternalStore } from "react";

import { watchConnection } from "@/packages/browser/network";

// Whether the browser says it has a connection, following it as it comes and goes, for what needs one (Ask Red, the
// message form, the daily board) to say so plainly. Online on the server and in the first client render, so hydration
// matches; the real value lands right after.
export const useOnline = (): boolean => useSyncExternalStore(watchConnection, () => navigator.onLine, () => true);
