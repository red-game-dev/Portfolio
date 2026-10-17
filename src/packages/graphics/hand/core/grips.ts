import type { ModelSocket } from "@/packages/graphics/stage3d";

import { HandGrip } from "../domain/types";

// Where a grip holds its thing, as a socket on the wrist (the palm does not move between poses, so the wrist's frame
// is the hand's): the thing's middle, its own x axis forward and its face (the side towards the viewer) up. A stage
// stands the hand so this socket meets the thing wherever the thing is.
export const gripSocket = (grip: HandGrip): ModelSocket => ({ joint: 0, offset: grip.centre, forward: grip.along, up: grip.face });
