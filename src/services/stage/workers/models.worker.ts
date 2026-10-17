import { buildHandSlot } from "@/packages/graphics/hand";
import { buildHeadSlot, isHeadModel } from "@/packages/graphics/head";
import { transferablesOf } from "@/packages/graphics/stage3d";

// Builds the site's models away from the page, so a slow device never stalls a frame meshing a hand or a head: each
// request names a slot, and the answer hands its arrays over rather than copying them.
const scope = self as unknown as Worker;

scope.addEventListener("message", (event: MessageEvent<{ request: number; model: string }>) => {
  const { request, model } = event.data;

  try {
    const asset = isHeadModel(model) ? buildHeadSlot(model) : buildHandSlot(model);

    scope.postMessage({ request, asset }, transferablesOf(asset));
  } catch (error) {
    scope.postMessage({ request, error: error instanceof Error ? error.message : String(error) });
  }
});
