import { useEffect, useState } from "react";

import { MOTION_ATTRIBUTE, prefersReducedMotion } from "@/packages/accessibility/motion";

// Whether the page keeps still, following the root's attribute as the reader's switch or the device's setting changes
// it, so an animation that runs on its own stops the moment it is asked to. False on the server and the first client
// render, so hydration matches; the real value lands right after mount.
export const useReducedMotion = (): boolean => {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const update = () => setIsReduced(prefersReducedMotion());
    const observer = new MutationObserver(update);

    update();
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [MOTION_ATTRIBUTE] });

    return () => observer.disconnect();
  }, []);

  return isReduced;
};
