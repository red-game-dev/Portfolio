import { useContext } from "react";

import { DeploysContext, DeploysState } from "@/components/Game/context/DeploysContext";

export const useDeploysStateHook = (): DeploysState => {
  const context = useContext(DeploysContext);

  if (!context) {
    throw new Error("useDeploysStateHook must be used inside a GameProvider");
  }

  return context;
};
