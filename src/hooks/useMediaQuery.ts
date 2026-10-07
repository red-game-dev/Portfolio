import { useEffect, useState } from "react";

// Whether a media query matches, following changes. False on the server and the first client render, so
// hydration matches; the real value lands right after mount.
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);

    update();
    list.addEventListener("change", update);

    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
};

export default useMediaQuery;
