import { RENDERING } from "@/config/rendering";
import { buildHandSlot, HAND_MODELS } from "@/packages/graphics/hand";
import { BuilderModelSource, ModelRegistry, Stage, StageService, WorkerModelSource } from "@/packages/graphics/stage3d";

// The site's 3D stage and its models, made once for the page. The models are slots: each id is registered with the
// source that builds it (in a worker, else on the page), and nothing is built until a scene asks for it or a section
// coming near preloads it. The stage is the first adapter that can draw here, as `RENDERING` allows; none in "2d".

const inWorker = new WorkerModelSource(
  () => (typeof Worker === "undefined" ? null : new Worker(new URL("./workers/models.worker.ts", import.meta.url))),
  new BuilderModelSource(buildHandSlot),
);

export const models = new ModelRegistry();

Object.values(HAND_MODELS).forEach((model) => models.register(model, inWorker));

const stages = new StageService(RENDERING.mode === "2d" ? [] : [
  async () => new (await import("@/packages/graphics/stage3d-three")).ThreeStage(models),
]);

// How much the stage draws on this device to begin with: less where memory or cores are few.
const startingQuality = (): number => {
  const device = typeof navigator === "undefined" ? null : (navigator as Navigator & { deviceMemory?: number });
  const memory = device?.deviceMemory ?? 8;
  const cores = device?.hardwareConcurrency ?? 8;

  return memory <= 2 || cores <= 2 ? 1 : memory <= 4 || cores <= 4 ? 2 : 3;
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

// What the payments counter needs, started as it comes near so its first payment never waits.
export const preloadCheckout = (): void => {
  if (RENDERING.mode === "2d") {
    return;
  }

  stageReady().catch(() => undefined);
  models.preload(...Object.values(HAND_MODELS));
};
