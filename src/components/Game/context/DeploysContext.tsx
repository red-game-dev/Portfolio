import { createContext, ReactNode, useCallback, useMemo, useState } from "react";

export interface DeploysState {
  // Deploys shipped from the DevOps universe's console this visit. Not remembered: every visit is a new run.
  deploysShipped: number;
  shipDeploy: () => void;
}

interface DeploysProviderProps {
  children: ReactNode;
}

export const DeploysContext = createContext<DeploysState | null>(null);

// Apart from the rest of the run, so a deploy re-renders only the console and the finale's board, not every reader of
// the game state across the page.
export const DeploysProvider = ({ children }: DeploysProviderProps) => {
  const [deploysShipped, setDeploysShipped] = useState(0);
  const shipDeploy = useCallback(() => setDeploysShipped((current) => current + 1), []);
  const value = useMemo(() => ({ deploysShipped, shipDeploy }), [deploysShipped, shipDeploy]);

  return <DeploysContext.Provider value={value}>{children}</DeploysContext.Provider>;
};
