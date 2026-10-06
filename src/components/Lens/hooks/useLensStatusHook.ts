import { useContext } from "react";

import { LensStatusContext, LensStatusState } from "@/components/Lens/context/LensContext";

export const useLensStatusHook = (): LensStatusState => {
  const context = useContext(LensStatusContext);

  if (!context) {
    throw new Error("useLensStatusHook must be used inside a LensProvider");
  }

  return context;
};
