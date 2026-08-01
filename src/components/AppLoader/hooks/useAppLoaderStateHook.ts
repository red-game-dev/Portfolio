import { useContext } from "react";

import {
  AppLoaderContext,
  AppLoaderState
} from "@/components/AppLoader/context/AppLoaderContext";

export const useAppLoaderStateHook = (): AppLoaderState => {
  const context = useContext(AppLoaderContext);

  if (!context) {
    throw new Error("useAppLoaderStateHook must be used inside an AppLoaderProvider");
  }

  return context;
};
