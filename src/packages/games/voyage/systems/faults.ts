import { FaultKind } from "../domain/faults";
import { VoyageState } from "../domain/state";

// How bad a kind of fault on board is, 0 when there is none.
export const faultSeverity = (state: VoyageState, kind: FaultKind): number => state.faults.find((fault) => fault.kind === kind)?.severity ?? 0;

// Whether a misfiring engine has cut out this moment: it stutters in and out, on a rhythm of its own, out for a
// share of the time that grows with how bad it is.
export const isMisfiring = (state: VoyageState, share: number): boolean => {
  const fault = state.faults.find((entry) => entry.kind === "misfire");

  if (!fault) {
    return false;
  }

  const t = (state.elapsedMs - fault.at) / 1000;
  const rhythm = (Math.sin(t * 7.3) + Math.sin(t * 2.9 + fault.id) + Math.sin(t * 13.1 + fault.id * 2)) / 3;

  return rhythm > 1 - 2 * share * fault.severity;
};
