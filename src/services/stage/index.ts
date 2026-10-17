import { RENDERING } from "@/config/rendering";
import { HAND_MODELS } from "@/packages/graphics/hand";
import { HEAD_MODELS } from "@/packages/graphics/head";
import { ModelRegistry, Stage, StageService, WorkerModelSource } from "@/packages/graphics/stage3d";

// The site's 3D stage and its models, made once for the page. The models are slots: each id is registered with the
// source that builds it, in a worker, and nothing is built until a scene asks for it or a section coming near preloads
// it. Where no worker runs, there is no model and the counter stays flat: meshing a hand on the page itself would stall
// it. The stage is the first adapter that can draw here, as `RENDERING` allows; none in "2d".

const inWorker = new WorkerModelSource(
  () => (typeof Worker === "undefined" ? null : new Worker(new URL("./workers/models.worker.ts", import.meta.url))),
);

export const models = new ModelRegistry();

[...Object.values(HAND_MODELS), ...Object.values(HEAD_MODELS)].forEach((model) => models.register(model, inWorker));

const stages = new StageService(RENDERING.mode === "2d" ? [] : [
  async () => new (await import("@/packages/graphics/stage3d-three")).ThreeStage(models),
]);

// How much the stage draws on this device to begin with: less where memory or cores are few, and a step down on a
// touch screen, whose memory a browser may not say (Safari never does); the frames then tell it to go lower or not.
const startingQuality = (): number => {
  const device = typeof navigator === "undefined" ? null : (navigator as Navigator & { deviceMemory?: number });
  const memory = device?.deviceMemory;
  const cores = device?.hardwareConcurrency ?? 8;
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  const guess = (memory ?? 8) <= 2 || cores <= 2 ? 1 : (memory ?? 8) <= 4 || cores <= 4 ? 2 : 3;

  return isTouch && memory === undefined ? Math.min(guess, 2) : guess;
};

let isTuned = false;

export const stageReady = async (): Promise<Stage | null> => {
  const stage = await stages.ready();

  if (stage && !isTuned) {
    stage.setQuality(startingQuality());
    isTuned = true;
  }

  return stage;
};

// What the payments counter needs, started as it comes near so its first payment never waits: the stage, the hands,
// the customer's head, and every material the counter shows, compiled once.
export const preloadCheckout = (): void => {
  if (RENDERING.mode === "2d") {
    return;
  }

  models.preload(...Object.values(HAND_MODELS), ...Object.values(HEAD_MODELS));
  stageReady()
    .then(async (stage) => {
      if (stage) {
        const { warmCheckoutStage } = await import("@/packages/graphics/checkout-stage");

        await warmCheckoutStage(stage);
      }
    })
    .catch(() => undefined);
};
