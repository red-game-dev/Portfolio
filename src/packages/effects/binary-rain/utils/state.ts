import { RainState } from "../domain/types";
import { cellKey } from "./grid";

export const isLockedCell = (state: RainState, column: number, row: number) => state.locked[cellKey(state.grid, column, row)] === 1;

export const isMessageComplete = (state: RainState) => state.message.every((cell) => cell.lockedAt !== null);
