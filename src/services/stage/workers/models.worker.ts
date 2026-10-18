import { buildHandSlot } from "@/packages/graphics/hand";
import { transferablesOf } from "@/packages/graphics/stage3d";

// Builds the site's models away from the page, so a slow device never stalls a frame meshing a hand: each request
// names a slot, and the answer hands its arrays over rather than copying them.
self.addEventListener("message", (event: MessageEvent<{ request: number; model: string }>) => {
  const { request, model } = event.data;

  try {
    const asset = buildHandSlot(model);

    self.postMessage({ request, asset }, { transfer: transferablesOf(asset) });
  } catch (error) {
    self.postMessage({ request, error: error instanceof Error ? error.message : String(error) });
  }
});
