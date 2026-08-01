import { createContext, useMemo, useState, Dispatch, ReactNode, SetStateAction } from "react";

export interface AppLoaderState {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isReady: boolean;
  setIsReady: Dispatch<SetStateAction<boolean>>;
}

interface AppLoaderProviderProps {
  children: ReactNode;
}

export const AppLoaderContext = createContext<AppLoaderState | null>(null);

export const AppLoaderProvider = ({ children }: AppLoaderProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const value = useMemo(
    () => ({ isLoading, setIsLoading, isReady, setIsReady }),
    [isLoading, isReady]
  );

  return <AppLoaderContext.Provider value={value}>{children}</AppLoaderContext.Provider>;
};
