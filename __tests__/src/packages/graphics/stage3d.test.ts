import {
  attachBy, BuilderModelSource, ModelAsset, ModelRegistry, ModelSource, poseSkeleton, SceneHandle, Skeleton, socketAt, socketBetween, Stage,
  StageService, transferablesOf, WorkerModelSource,
} from "@/packages/graphics/stage3d";
import { fromAxisAngle, rotate, scale, vec3 } from "@/packages/math/space";

const asset = (id: string): ModelAsset => ({
  id,
  parts: [{
    name: "body",
    material: { kind: "matte" },
    mesh: { positions: new Float32Array(9), normals: new Float32Array(9), indices: new Uint32Array([0, 1, 2]), skinWeights: new Float32Array(12) },
  }],
});

// A chain of three joints along y: a root, an elbow 10 along, a tip 10 further.
const ARM: Skeleton = {
  joints: [
    { name: "root", parent: -1, position: vec3(0, 0, 0) },
    { name: "elbow", parent: 0, position: vec3(0, 10, 0) },
    { name: "tip", parent: 1, position: vec3(0, 20, 0) },
  ],
};

const close = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => {
  expect(a.x).toBeCloseTo(b.x, 4);
  expect(a.y).toBeCloseTo(b.y, 4);
  expect(a.z).toBeCloseTo(b.z, 4);
};

class FakeStage extends Stage {
  public readonly id: string;
  public isDisposed = false;
  private readonly canDraw: boolean;

  constructor(id: string, canDraw: boolean) {
    super(new ModelRegistry());
    this.id = id;
    this.canDraw = canDraw;
  }

  public get quality() {
    return 3;
  }

  public prepare() {
    return Promise.resolve(this.canDraw);
  }

  public mount(): Promise<SceneHandle> {
    return Promise.resolve({ id: 1 });
  }

  public setPicture() {
    return undefined;
  }

  public draw() {
    return undefined;
  }

  public unmount() {
    return undefined;
  }

  public setQuality() {
    return undefined;
  }

  public dispose() {
    this.isDisposed = true;
  }

  public takeAway() {
    this.lose();
  }
}

describe("graphics/stage3d", () => {
  it("poses a skeleton: a joint turned carries every joint after it", () => {
    const posed = poseSkeleton(ARM, [undefined, fromAxisAngle(vec3(0, 0, 1), Math.PI / 2)]);

    close(posed.positions[1], vec3(0, 10, 0));
    close(posed.positions[2], vec3(-10, 10, 0));
  });

  it("attaches an actor by a socket: the socket lands on the target, facing its way", () => {
    const posed = poseSkeleton(ARM, []);
    const tip = socketAt(posed, { joint: 2, offset: vec3(0, 0, 0), forward: vec3(0, 1, 0), up: vec3(0, 0, 1) });
    const target = { position: vec3(50, 40, 3), forward: vec3(1, 0, 0), up: vec3(0, 0, 1) };
    const placed = attachBy(tip, 2, target);

    // The tip, 40 along the arm at twice the size, turned from along y to along x.
    close(rotate(placed.rotation, scale(tip.position, 2)), vec3(40, 0, 0));
    close(placed.position, vec3(50 - 40, 40, 3));
    close(rotate(placed.rotation, tip.forward), target.forward);
  });

  it("finds the point between two sockets, facing from the second to the first", () => {
    const between = socketBetween(
      { position: vec3(0, 0, 4), forward: vec3(1, 0, 0), up: vec3(0, 0, 1) },
      { position: vec3(0, 0, -4), forward: vec3(1, 0, 0), up: vec3(0, 0, -1) },
    );

    close(between.position, vec3(0, 0, 0));
    close(between.up, vec3(0, 0, 1));
    close(between.forward, vec3(1, 0, 0));
  });

  it("loads a slot's model once however often it is asked for, and tries again after a failure", async () => {
    let builds = 0;
    let isBroken = true;
    const registry = new ModelRegistry().register("thing", new BuilderModelSource((id) => {
      builds += 1;

      if (isBroken) {
        throw new Error("not yet");
      }

      return asset(id);
    }));

    await expect(registry.load("thing")).rejects.toThrow("not yet");
    isBroken = false;
    await Promise.all([registry.load("thing"), registry.load("thing")]);
    expect(builds).toBe(2);
    expect(registry.isLoaded("thing")).toBe(true);
    await expect(registry.load("nothing")).rejects.toThrow("No slot");
  });

  it("builds on the page when no worker starts", async () => {
    const source: ModelSource = new WorkerModelSource(() => null, new BuilderModelSource(asset));

    await expect(source.load("thing")).resolves.toMatchObject({ id: "thing" });
  });

  it("hands every array of a model over rather than copying it", () => {
    expect(transferablesOf(asset("thing"))).toHaveLength(4);
  });

  it("uses the first stage that can draw, and moves on when one loses its GPU", async () => {
    const blind = new FakeStage("blind", false);
    const first = new FakeStage("first", true);
    const second = new FakeStage("second", true);
    const made = [blind, first, second];
    const service = new StageService(made.map((stage) => () => Promise.resolve(stage)));

    await expect(service.ready()).resolves.toBe(first);
    expect(blind.isDisposed).toBe(true);
    first.takeAway();
    expect(first.isDisposed).toBe(true);
    await expect(service.ready()).resolves.toBe(second);
  });

  it("has no stage where no adapter can draw", async () => {
    const service = new StageService([() => Promise.reject(new Error("no code")), () => Promise.resolve(new FakeStage("blind", false))]);

    await expect(service.ready()).resolves.toBeNull();
  });
});
