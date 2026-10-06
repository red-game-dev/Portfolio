import { useEffect, useState } from "react";

type Loaded<T> = { status: "waiting" } | { status: "ready"; value: T } | { status: "failed" };

// Runs `load` the first time `isWanted` turns true and keeps what it returns. A failed load (a chunk lost
// to a redeploy, a dropped connection) is reported in the console and returned as failed, so the caller
// can give back the room it held instead of leaving a gap.
const useLoaded = <T>(load: () => Promise<T>, isWanted: boolean): Loaded<T> => {
  const [loaded, setLoaded] = useState<Loaded<T>>({ status: "waiting" });
  const isSettled = loaded.status !== "waiting";

  useEffect(() => {
    if (!isWanted || isSettled) {
      return;
    }

    let isCurrent = true;

    load()
      .then((value) => {
        if (isCurrent) {
          setLoaded({ status: "ready", value });
        }
      })
      .catch((error: unknown) => {
        // console.error is the one console call the production build keeps (next.config.js).
        // eslint-disable-next-line no-console
        console.error("A blueprint could not be loaded", error);

        if (isCurrent) {
          setLoaded({ status: "failed" });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isSettled, isWanted, load]);

  return loaded;
};

export default useLoaded;
