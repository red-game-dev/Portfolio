import { Camera, ComponentStore, EventBus, Pool, SpatialHash, SystemPipeline, World } from "@/packages/games/engine";

describe("games/engine", () => {
  test("a component store packs values, finds them by entity, and removes in place", () => {
    const store = new ComponentStore<{ hp: number }>();

    store.set(1, { hp: 10 });
    store.set(2, { hp: 20 });
    store.set(3, { hp: 30 });
    store.remove(1);

    expect(store.size).toBe(2);
    expect(store.get(3)).toEqual({ hp: 30 });
    expect(store.get(1)).toBeUndefined();
    expect([...store.entities].sort()).toEqual([2, 3]);
  });

  test("the world defers despawning to flush, so a system can despawn while others walk the stores", () => {
    const world = new World({ body: new ComponentStore<{ x: number }>(), tag: new ComponentStore<string>() });
    const first = world.spawn();
    const second = world.spawn();

    world.stores.body.set(first, { x: 1 });
    world.stores.tag.set(first, "rock");
    world.stores.body.set(second, { x: 2 });
    world.despawn(first);

    expect(world.stores.body.has(first)).toBe(true);
    expect(world.isAlive(first)).toBe(false);

    world.flush();
    expect(world.stores.body.has(first)).toBe(false);
    expect(world.stores.tag.size).toBe(0);
    expect(world.count).toBe(1);
  });

  test("events reach their handlers with their own payload type, and unsubscribe", () => {
    const bus = new EventBus<{ hit: { damage: number }; lost: { score: number } }>();
    const damage: number[] = [];
    const off = bus.on("hit", ({ damage: amount }) => damage.push(amount));

    bus.emit("hit", { damage: 5 });
    off();
    bus.emit("hit", { damage: 7 });

    expect(damage).toEqual([5]);
  });

  test("the pipeline runs whole fixed steps, carries the rest, and caps a stall", () => {
    const ran: number[] = [];
    const pipeline = new SystemPipeline([{ name: "count", update: (_: null, dt: number) => ran.push(dt) }], { stepMs: 10, maxSteps: 3 });

    expect(pipeline.advance(null, 25)).toBe(2);
    expect(pipeline.alpha).toBeCloseTo(0.5, 10);
    expect(ran.every((dt) => dt === 0.01)).toBe(true);
    expect(pipeline.advance(null, 1000)).toBe(3);
    expect(pipeline.alpha).toBeLessThanOrEqual(1);
  });

  test("the camera settles on its target without overshoot, and converts between world and screen", () => {
    const camera = new Camera({ pixelsPerUnit: 100, stiffness: 8 });
    let farthest = 0;

    camera.resize({ width: 800, height: 600 }, 100);

    for (let step = 0; step < 240; step += 1) {
      camera.follow(10, 5, 1 / 60);
      farthest = Math.max(farthest, camera.x);
    }

    expect(camera.x).toBeCloseTo(10, 2);
    expect(farthest).toBeLessThanOrEqual(10.001);
    expect(camera.toWorldX(camera.toScreenX(3))).toBeCloseTo(3, 10);
    expect(camera.sees(10, 5, 0)).toBe(true);
    expect(camera.sees(20, 5, 0.5)).toBe(false);
  });

  test("the spatial hash finds what is near once, and not what is far", () => {
    const grid = new SpatialHash(1);
    const found: number[] = [];

    grid.insert(1, 0.5, 0.5, 0.6);
    grid.insert(2, 0.9, 0.2, 0.1);
    grid.insert(3, 9, 9, 0.1);
    grid.near(0.6, 0.6, 0.5, (entity) => found.push(entity));

    expect(found.sort()).toEqual([1, 2]);
  });

  test("a pool hands back what was released before making new", () => {
    let made = 0;
    const pool = new Pool(() => ({ id: (made += 1) }));
    const first = pool.acquire();

    pool.release(first);

    expect(pool.acquire()).toBe(first);
    expect(made).toBe(1);
  });
});
