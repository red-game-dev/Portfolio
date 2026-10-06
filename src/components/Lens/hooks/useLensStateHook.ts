import { useContext } from "react";

import { LensContext, LensState } from "@/components/Lens/context/LensContext";

export const useLensStateHook = (): LensState => {
  const context = useContext(LensContext);

  if (!context) {
    throw new Error("useLensStateHook must be used inside a LensProvider");
  }

  return context;
};
