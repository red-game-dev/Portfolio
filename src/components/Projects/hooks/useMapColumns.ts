import { useEffect, useState } from "react";

import { MAP_COLUMNS, NARROW_QUERY } from "@/components/Projects/config";

// The wide layout renders on the server and first paint; narrow screens switch after mount, so the
// markup always hydrates cleanly.
export const useMapColumns = () => {
  const [columns, setColumns] = useState<number>(MAP_COLUMNS.wide);

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const update = () => setColumns(query.matches ? MAP_COLUMNS.narrow : MAP_COLUMNS.wide);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return columns;
};
