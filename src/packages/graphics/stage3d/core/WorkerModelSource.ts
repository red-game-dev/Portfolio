import { ModelAsset } from "../domain/types";
import { ModelSource } from "./ModelSource";

interface Answer {
  request: number;
  asset?: ModelAsset;
  error?: string;
}

// Models built away from the page, in a worker the host makes (so its bundler can find the worker's code): each load
// is a request the worker answers with the model, its arrays handed over rather than copied. Where no worker starts,
// or one fails, the fallback source builds it instead.
export class WorkerModelSource extends ModelSource {
  public readonly id = "worker";
  private readonly createWorker: () => Worker | null;
  private readonly fallback: ModelSource | null;
  private worker: Worker | null | undefined;
  private nextRequest = 1;
  private readonly waiting = new Map<number, { resolve: (asset: ModelAsset) => void; reject: (error: Error) => void }>();

  constructor(createWorker: () => Worker | null, fallback: ModelSource | null = null) {
    super();
    this.createWorker = createWorker;
    this.fallback = fallback;
  }

  public load(model: string): Promise<ModelAsset> {
    const worker = this.workerOf();

    if (!worker) {
      return this.fallback ? this.fallback.load(model) : Promise.reject(new Error("No worker to build models in"));
    }

    const request = this.nextRequest;

    this.nextRequest += 1;

    return new Promise<ModelAsset>((resolve, reject) => {
      this.waiting.set(request, { resolve, reject });
      worker.postMessage({ request, model });
    }).catch((error: unknown) => (this.fallback ? this.fallback.load(model) : Promise.reject(error)));
  }

  public dispose(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  private workerOf(): Worker | null {
    if (this.worker !== undefined) {
      return this.worker;
    }

    try {
      this.worker = this.createWorker();
    } catch {
      this.worker = null;
    }

    this.worker?.addEventListener("message", (event: MessageEvent<Answer>) => {
      const { request, asset, error } = event.data;
      const waiter = this.waiting.get(request);

      this.waiting.delete(request);

      if (asset) {
        waiter?.resolve(asset);
      } else {
        waiter?.reject(new Error(error ?? "The model could not be built"));
      }
    });
    this.worker?.addEventListener("error", () => {
      this.waiting.forEach((waiter) => waiter.reject(new Error("The model worker stopped")));
      this.waiting.clear();
      this.worker?.terminate();
      this.worker = null;
    });

    return this.worker;
  }
}

// Every array a model holds, to hand over to the page instead of copying.
export const transferablesOf = (asset: ModelAsset): ArrayBuffer[] => asset.parts.flatMap(({ mesh }) => [
  mesh.positions.buffer,
  mesh.normals.buffer,
  mesh.indices.buffer,
  ...(mesh.colors ? [mesh.colors.buffer] : []),
  ...(mesh.skinIndices ? [mesh.skinIndices.buffer] : []),
  ...(mesh.skinWeights ? [mesh.skinWeights.buffer] : []),
  ...Object.values(mesh.extras ?? {}).map(({ data }) => data.buffer),
]).filter((buffer, index, all): buffer is ArrayBuffer => buffer instanceof ArrayBuffer && all.indexOf(buffer) === index);
