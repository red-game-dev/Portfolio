// What the player asks for this step.
export interface VoyageInput {
  // A world point to turn towards, from a pointer or a finger; null when there is none.
  aim: { x: number; y: number } | null;
  // 0 to 1: how hard to burn. A pointer sets it by how far the aim is; keys set 0 or 1.
  thrust: number;
  // -1 to 1 from keys, to turn without a pointer.
  turn: number;
  brake: boolean;
}

export const NO_INPUT: VoyageInput = { aim: null, thrust: 0, turn: 0, brake: false };
