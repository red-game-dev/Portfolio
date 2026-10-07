import { useContext } from "react";

import { GameContext, GameState } from "@/components/Game/context/GameContext";

export const useGameStateHook = (): GameState => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGameStateHook must be used inside a GameProvider");
  }

  return context;
};
